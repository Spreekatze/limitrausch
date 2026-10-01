import express from "express";
const router = express.Router();

router.use((_request, _response, next) => {
  console.log(`Request received at ${new Date().toISOString()}`);
  next();
});

router.post("/login", (request, response) => {
  const { username, password } = request.body;
  console.log(
    `Login attempt with username: ${username} and password: ${password}`,
  );
  // Example login logic (replace with real authentication)
  if (username === "user" && password === "pass") {
    response.json({ message: "Login successful", token: "fake-jwt-token" });
  } else {
    response.status(401).json({
      error: "Invalid credentials",
      message: "Login failed due to invalid credentials",
    });
  }
});

export default router;
