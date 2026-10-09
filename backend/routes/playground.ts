import express from "express";
import requireAdmin from "../middleware/auth.js";

const router = express.Router();

// router.use((_request, _response, next) => {
//   console.log(`Request received at ${new Date().toISOString()}`);
//   next();
// });

// router.post("/login", (request, response) => {
//   const { username, password } = request.body;
//   console.log(
//     `Login attempt with username: ${username} and password: ${password}`,
//   );
//   // Example login logic (replace with real authentication)
//   if (username === "user" && password === "pass") {
//     response.json({ message: "Login successful", token: "fake-jwt-token" });
//   } else {
//     response.status(401).json({
//       error: "Invalid credentials",
//       message: "Login failed due to invalid credentials",
//     });
//   }
// });

router.get("/admin/test", requireAdmin, (request, response) => {
  response.json({
    success: true,
    message: "Admin access granted.",
    user: request.session.authUser,
  });
});

router.post("/event", requireAdmin, (request, response) => {
  console.log("New event:", request.body);
  response.status(201).json({ message: "Event received", event: request.body });
});

export default router;
