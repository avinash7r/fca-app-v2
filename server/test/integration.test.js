import "dotenv/config";
import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";

const suppliedTestUri = process.env.TEST_MONGO_URI;

const extractCookie = (response) => response.headers.get("set-cookie")?.split(";")[0];

const parseResponse = async (response) => {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

const isolatedDatabaseUri = (uri, databaseName) => {
  const url = new URL(uri);
  url.pathname = `/${databaseName}`;
  return url.toString();
};

test(
  "API and Socket.IO integration with a disposable MongoDB database",
  { skip: suppliedTestUri ? false : "Set TEST_MONGO_URI to run MongoDB integration tests" },
  async () => {
    const sourceUrl = new URL(suppliedTestUri);
    const sourceDatabase = sourceUrl.pathname.replace(/^\//, "");
    assert.match(sourceDatabase, /test/i, "Refusing integration tests: Mongo database name must contain 'test'");

    const temporaryDatabase = `${sourceDatabase}_run_${process.pid}_${Date.now()}`;
    process.env.MONGO_URI = isolatedDatabaseUri(suppliedTestUri, temporaryDatabase);
    process.env.JWT_SECRET ||= "integration-test-secret-use-only-in-tests-1234";
    process.env.NODE_ENV = "test";
    process.env.CORS_ORIGIN ||= "http://localhost:5173";

    const [{ connectDB, disconnectDB }, { User }, { Message }, { app }, { io, server }] =
      await Promise.all([
        import("../src/lib/connectDB.js"),
        import("../src/models/user.model.js"),
        import("../src/models/message.model.js"),
        import("../src/app.js"),
        import("../src/lib/socket.js"),
      ]);

    let databaseConnected = false;
    let serverStarted = false;
    let baseUrl;

    const request = async (path, { method = "GET", body, cookie, origin = "http://localhost:5173" } = {}) => {
      const response = await fetch(`${baseUrl}${path}`, {
        method,
        headers: {
          ...(origin ? { origin } : {}),
          ...(body !== undefined ? { "content-type": "application/json" } : {}),
          ...(cookie ? { cookie } : {}),
        },
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      });
      return { response, data: await parseResponse(response) };
    };

    const register = async (email, username) => {
      const result = await request("/api/auth/register", {
        method: "POST",
        body: { username, email, password: "integration-pass-123" },
      });
      assert.equal(result.response.status, 201, JSON.stringify(result.data));
      assert.ok(result.data.user?.id);
      return { ...result, cookie: extractCookie(result.response) };
    };

    const openSocketTransport = async (cookie) => {
      const query = `EIO=4&transport=polling&t=${Date.now()}-${Math.random()}`;
      const openResponse = await fetch(`${baseUrl}/socket.io/?${query}`, {
        headers: {
          origin: "http://localhost:5173",
          ...(cookie ? { cookie } : {}),
        },
      });
      assert.equal(openResponse.status, 200);
      const handshake = await openResponse.text();
      assert.equal(handshake[0], "0", handshake);
      const { sid } = JSON.parse(handshake.slice(1));
      const sessionUrl = `${baseUrl}/socket.io/?EIO=4&transport=polling&sid=${encodeURIComponent(sid)}&t=${Date.now()}`;
      const headers = {
        origin: "http://localhost:5173",
        "content-type": "text/plain;charset=UTF-8",
        ...(cookie ? { cookie } : {}),
      };
      return { sessionUrl, headers };
    };

    try {
      await connectDB();
      databaseConnected = true;
      await new Promise((resolve, reject) => {
        const onError = (error) => reject(error);
        server.once("error", onError);
        server.listen(0, "127.0.0.1", () => {
          server.off("error", onError);
          serverStarted = true;
          baseUrl = `http://127.0.0.1:${server.address().port}`;
          resolve();
        });
      });

      const health = await request("/health");
      assert.equal(health.response.status, 200);
      assert.deepEqual(health.data, { status: "ok" });

      const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const emailA = `integration-${suffix}@example.test`;
      const emailB = `recipient-${suffix}@example.test`;
      const first = await register(emailA, "Integration User");
      assert.ok(first.cookie);
      assert.equal(first.data.user.email, emailA);
      assert.equal("password" in first.data.user, false);

      const duplicate = await request("/api/auth/register", {
        method: "POST",
        body: { username: "Duplicate", email: emailA.toUpperCase(), password: "integration-pass-123" },
      });
      assert.equal(duplicate.response.status, 409);

      for (const body of [
        { username: {}, email: `invalid-${suffix}@example.test`, password: "integration-pass-123" },
        { username: "Invalid", email: "not-an-email", password: "integration-pass-123" },
        { username: "Invalid", email: `short-${suffix}@example.test`, password: "short" },
      ]) {
        const invalid = await request("/api/auth/register", { method: "POST", body });
        assert.equal(invalid.response.status, 400);
      }

      const login = await request("/api/auth/login", {
        method: "POST",
        body: { email: emailA.toUpperCase(), password: "integration-pass-123" },
      });
      assert.equal(login.response.status, 200);
      assert.equal(login.data.user.email, emailA);
      assert.ok(extractCookie(login.response));

      const badLogin = await request("/api/auth/login", {
        method: "POST",
        body: { email: emailA, password: "wrong-password" },
      });
      assert.equal(badLogin.response.status, 401);

      const authCheck = await request("/api/auth/check", { cookie: first.cookie });
      assert.equal(authCheck.response.status, 200);
      assert.equal(authCheck.data.user.id, first.data.user.id);
      assert.equal("password" in authCheck.data.user, false);

      const noAuth = await request("/api/message/users");
      assert.equal(noAuth.response.status, 401);
      const badToken = await request("/api/message/users", { cookie: "token=not-a-valid-jwt" });
      assert.equal(badToken.response.status, 401);

      const second = await register(emailB, "Recipient User");
      const sidebar = await request("/api/message/users", { cookie: first.cookie });
      assert.equal(sidebar.response.status, 200);
      assert.ok(sidebar.data.some((user) => user._id === second.data.user.id));
      assert.ok(sidebar.data.every((user) => !("password" in user)));
      assert.ok(sidebar.data.every((user) => user._id !== first.data.user.id));

      const invalidRecipient = await request("/api/message/not-an-object-id", { cookie: first.cookie });
      assert.equal(invalidRecipient.response.status, 400);

      const sent = await request(`/api/message/send/${second.data.user.id}`, {
        method: "POST",
        cookie: first.cookie,
        body: { text: "integration message" },
      });
      assert.equal(sent.response.status, 201, JSON.stringify(sent.data));
      assert.equal(sent.data.text, "integration message");

      const emptyMessage = await request(`/api/message/send/${second.data.user.id}`, {
        method: "POST",
        cookie: first.cookie,
        body: { text: "   " },
      });
      assert.equal(emptyMessage.response.status, 400);

      const hostileOrigin = await request(`/api/message/send/${second.data.user.id}`, {
        method: "POST",
        cookie: first.cookie,
        origin: "https://untrusted.example",
        body: { text: "must be blocked" },
      });
      assert.equal(hostileOrigin.response.status, 403);

      const history = await request(`/api/message/${second.data.user.id}`, { cookie: first.cookie });
      assert.equal(history.response.status, 200);
      assert.equal(history.data.length, 1);
      assert.equal(history.data[0].text, "integration message");

      const logout = await request("/api/auth/logout", {
        method: "POST",
        cookie: first.cookie,
        body: {},
      });
      assert.equal(logout.response.status, 200);
      assert.match(logout.response.headers.get("set-cookie") || "", /token=;/);

      const unauthenticatedSocket = await openSocketTransport();
      await fetch(unauthenticatedSocket.sessionUrl, {
        method: "POST",
        headers: unauthenticatedSocket.headers,
        body: "40",
      });
      const rejectedSocket = await fetch(unauthenticatedSocket.sessionUrl, {
        headers: unauthenticatedSocket.headers,
      });
      assert.match(await rejectedSocket.text(), /Unauthorized/);

      const authenticatedSocket = await openSocketTransport(first.cookie);
      await fetch(authenticatedSocket.sessionUrl, {
        method: "POST",
        headers: authenticatedSocket.headers,
        body: "40",
      });
      const connectedSocket = await fetch(authenticatedSocket.sessionUrl, {
        headers: authenticatedSocket.headers,
      });
      assert.match(await connectedSocket.text(), /40\{/);

      const preflight = await fetch(`${baseUrl}/api/auth/login`, {
        method: "OPTIONS",
        headers: {
          origin: "http://localhost:5173",
          "access-control-request-method": "POST",
          "access-control-request-headers": "content-type",
        },
      });
      assert.equal(preflight.status, 204);
      assert.equal(preflight.headers.get("access-control-allow-origin"), "http://localhost:5173");
    } finally {
      if (serverStarted) await new Promise((resolve) => io.close(resolve));
      if (mongoose.connection.readyState === 1) {
        try {
          if (mongoose.connection.name === temporaryDatabase) {
            await mongoose.connection.dropDatabase();
          }
        } finally {
          await disconnectDB();
        }
      } else if (databaseConnected || mongoose.connection.readyState !== 0) {
        await disconnectDB();
      }
    }
  }
);
