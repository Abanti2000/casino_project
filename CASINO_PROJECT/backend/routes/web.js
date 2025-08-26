import express from "express";
import rateLimit from "express-rate-limit";
import accountController from "../controllers/accountController.js";
import withdrawalController from "../controllers/withdrawalController.js";
import middlewareController from "../controllers/middlewareController.js";
import homeController from "../controllers/homeController.js";
import userController from "../controllers/userController.js";
import paymentController from "../controllers/paymentController.js";


const initWebRouter = (app) => {
  const router = express.Router();

  const withdrawalRateLimiter = rateLimit({
    windowMs: 5 * 1000, // 15 minutes
    max: 1, // Limit each IP to 5 withdrawal requests per windowMs
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    handler: function (req, res /*, next */) {
      res.status(429).json({
        message:
          "Too many withdrawal requests created from this IP, please try again after 5 second",
        status: false,
        timeStamp: new Date().toISOString(),
      });
    },
  });


  router.post("/api/webapi/register", accountController.register);
  router.post("/api/webapi/login", accountController.login);
  router.get("/api/webapi/GetUserInfo", middlewareController, userController.userInfo);
//   router.get("/api/webapi/GetUserInfo", middlewareController, (req, res) => {
//   res.json({ message: "User info fetched successfully", token: req.userToken });
// });
router.get( "/api/webapi/withdraw/bank_card",  middlewareController, withdrawalController.getBankCardInfo, );
 router.post( "/api/webapi/check/Info", middlewareController, userController.infoUserBank,);


  

   router.get(
    "/wallet/paynow/rspay",
    middlewareController,
    paymentController.initiateManualUPIPayment,
  );
  


  app.use("/", router);
};

const routes = {
  initWebRouter,
};

export default routes;