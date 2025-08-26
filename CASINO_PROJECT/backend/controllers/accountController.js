import connection from "../config/db.js";

import jwt from "jsonwebtoken";
import md5 from "md5";
import moment from "moment";
import Joi from "joi";
import bcrypt from "bcrypt";
import _ from "lodash";

const saltRounds = parseInt(process.env.SALT_ROUNDS || 10);

const utils = {
  generateUniqueNumberCodeByDigit(digit) {
    const timestamp = new Date().getTime().toString();
    const randomNum = _.random(1e12).toString();
    const combined = timestamp + randomNum;
    return _.padStart(combined.slice(-digit), digit, "0");
  },
  
  getIpAddress(req) {
    let ipAddress = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    if (ipAddress && ipAddress.substr(0, 7) == "::ffff:") {
      ipAddress = ipAddress.substr(7);
    }
    return ipAddress || "127.0.0.1";
  }
};

// register API
const register = async (req, res) => {
  try {
    console.log("=== REGISTRATION START ===");
    console.log("Request Body:", req.body);

    const schema = Joi.object({
      username: Joi.string().min(3).max(20).alphanum().required(),
      password: Joi.string().min(6).required(),
      invitecode: Joi.string().optional(),
    });

    const { error } = schema.validate(req.body);
    if (error) {
      console.log("Validation Error:", error.details[0].message);
      return res.status(400).json({
        status: false,
        message: error.details[0].message
      });
    }

    const { username, password, invitecode } = req.body;

    console.log('Registration request:', { username, invitecode: invitecode || 'none' });

    const [check_username] = await connection.query(
      "SELECT * FROM users WHERE name_user = ?",
      [username]
    );

    if (check_username.length > 0) {
      console.log("Username already exists");
      return res.status(400).json({
        message: 'Username already taken',
        status: false
      });
    }

    let id_user = utils.generateUniqueNumberCodeByDigit(7);
    let attempts = 0;
    while (true) {
      attempts++;
      console.log(`Checking User ID uniqueness - Attempt ${attempts}`);
      
      const [rows] = await connection.query(
        "SELECT `id_user` FROM users WHERE `id_user` = ?",
        [id_user]
      );

      if (_.isEmpty(rows)) {
        console.log("User ID is unique:", id_user);
        break;
      }

      console.log("User ID exists, generating new one");
      id_user = utils.generateUniqueNumberCodeByDigit(7);
    }

    let inviter_info = null;
    if (invitecode) {
      const [check_invite] = await connection.query(
        "SELECT * FROM users WHERE code = ?",
        [invitecode]
      );

      if (check_invite.length === 0) {
        console.log("Invalid invite code");
        return res.status(400).json({
          message: "Invalid referrer code",
          status: false
        });
      }
      inviter_info = check_invite[0];
    }

    const ip = utils.getIpAddress(req);
    const [check_ip] = await connection.query(
      "SELECT * FROM users WHERE ip_address = ?",
      [ip]
    );


    const code = utils.generateUniqueNumberCodeByDigit(5) + id_user;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const time = moment().valueOf();
    const bonus_money = parseFloat(process.env.BONUS_MONEY_ON_REGISTER || 0);

    let ctv = inviter_info ? (inviter_info.level == 2 ? inviter_info.name_user : inviter_info.ctv) : '';

    console.log("Inserting new user into database...");
    
    const sql = `
      INSERT INTO users SET 
      id_user = ?, dial_code = ?, phone = ?, id = 0, token = '', name_user = ?, 
      password = ?, plain_password = ?, money = ?, total_money = ?, needbet = ?, 
      bonus_money = ?, roses_f1 = ?, roses_f = ?, roses_today = ?, level = ?, 
      rank = ?, code = ?, invite = ?, ctv = ?, veri = ?, otp = ?, 
      ip_address = ?, status = ?, today = ?, time = ?, time_otp = ?, 
      user_level = ?, avatar = ?, vip_level = ?, isdemo = ?, 
      ezugiLaunchToken = '', spribeLaunchToken = '', smartSoftLaunchToken = ''
    `;
    
    const insertParams = [
      id_user,                    // id_user
      '',                         // dial_code (empty since no phone)
      username,                   // phone field used for username
      username,                   // name_user
      hashedPassword,             // password
      password,                   // plain_password
      bonus_money,                // money
      0,                          // total_money
      0,                          // needbet
      bonus_money,                // bonus_money
      0,                          // roses_f1
      0,                          // roses_f
      0,                          // roses_today
      1,                          // level
      0,                          // rank
      code,                       // code
      invitecode || '',           // invite
      ctv || '',                  // ctv (empty string instead of null)
      1,                          // veri (verified immediately)
      0,                          // otp
      ip,                         // ip_address
      1,                          // status (active)
      0,                          // today
      time,                       // time
      0,                          // time_otp
      0,                          // user_level
      '',                         // avatar
      0,                          // vip_level
      0                           // isdemo
    ];
    
    console.log("Insert SQL:", sql);
    console.log("Insert Params:", insertParams);

    await connection.execute(sql, insertParams);
    console.log("User inserted successfully");

    try {
      await connection.execute("INSERT INTO point_list SET phone = ?", [username]);
      console.log("Point list entry created");
    } catch (pointError) {
      console.log("Point list insert error (might not exist):", pointError.message);
    }

    try {
      await connection.query(
        "INSERT INTO turn_over SET phone = ?, code = ?, invite = ?",
        [username, code, invitecode || '']
      );
      console.log("Turnover record created");
    } catch (turnoverError) {
      console.log("Turnover insert error (might not exist):", turnoverError.message);
    }

    if (inviter_info && inviter_info.name_user !== "Admin") {
      const [referral_count] = await connection.query(
        "SELECT COUNT(*) as count FROM users WHERE invite = ?",
        [invitecode]
      );
      
      const levels = [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35, 38, 41, 44];
      const currentReferrals = referral_count[0].count;
      
      for (let i = 0; i < levels.length; i++) {
        if (currentReferrals >= levels[i]) {
          await connection.execute(
            "UPDATE users SET user_level = ? WHERE code = ?",
            [i + 1, invitecode]
          );
          console.log(`Updated referrer level to: ${i + 1}`);
        }
      }
    }

    const [newUser] = await connection.query(
      "SELECT * FROM users WHERE phone = ?",
      [username]
    );
    
    const userData = newUser[0];
    const tokenPayload = {
      id_user: userData.id_user,
      username: userData.phone, 
      name_user: userData.name_user,
      level: userData.level
    };

    const jwtSecret = process.env.JWT_ACCESS_TOKEN;
    if (!jwtSecret) {
      console.error("JWT_ACCESS_TOKEN environment variable is not set");
      return res.status(500).json({
        status: false,
        message: "Server configuration error: JWT secret not configured"
      });
    }

    const accessToken = jwt.sign(
      tokenPayload,
      jwtSecret,
      { expiresIn: "7d" }
    );

    const tokenHash = md5(accessToken);
    await connection.execute(
      "UPDATE users SET token = ? WHERE phone = ?",
      [tokenHash, username]
    );

    console.log("REGISTRATION COMPLETED SUCCESSFULLY");
    
    return res.status(201).json({
      message: "Registered successfully",
      status: true,
      data: {
        id_user: userData.id_user,
        username: userData.phone,
        name_user: userData.name_user,
        code: userData.code,
        money: userData.money,
        bonus_money: userData.bonus_money
      },
      token: accessToken
    });

  } catch (error) {
    console.error("REGISTRATION ERROR:");
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    
    return res.status(500).json({
      status: false,
      message: "Internal Server Error"
    });
  }
};

// LOGIN API

const login = async (req, res) => {
  try {
    console.log("=== LOGIN START ===");
    console.log("Request Body:", req.body);

    const schema = Joi.object({
      username: Joi.string().min(3).max(20).required(),
      password: Joi.string().min(6).required()
    });

    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ status: false, message: error.details[0].message });
    }

    const { username, password } = req.body;

    const [users] = await connection.query(
      "SELECT * FROM users WHERE phone = ?",
      [username]
    );

    if (users.length === 0) {
      return res.status(401).json({ status: false, message: "Invalid username or password" });
    }

    const user = users[0];
    console.log(`User found: ${user.name_user} (ID: ${user.id_user})`);


    if (user.veri !== 1) {
      console.log("LOGIN FAILED: Account not verified");
      return res.status(403).json({
        status: false,
        message: "Account is not verified"
      });
    }

    if (user.status !== 1) {
      console.log("LOGIN FAILED: Account locked, status:", user.status);
      return res.status(403).json({
        status: false,
        message: "Account has been locked"
      });
    }


    console.log("Verifying password...");
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ status: false, message: "Invalid username or password" });
    }

    const tokenPayload = {
      id_user: user.id_user,
      username: user.phone,
      name_user: user.name_user,
      level: user.level,
      user_level: user.user_level,
      vip_level: user.vip_level
    };


    const jwtSecret = process.env.JWT_ACCESS_TOKEN;
    if (!jwtSecret) {
      console.error("JWT_ACCESS_TOKEN environment variable is not set");
      return res.status(500).json({
        status: false,
        message: "Server configuration error: JWT secret not configured"
      });
    }

    const accessToken = jwt.sign(
      tokenPayload,
      jwtSecret,
      { expiresIn: "7d" }
    );


    const tokenHash = md5(accessToken);
    const currentTime = moment().valueOf();
    
    await connection.execute(
      "UPDATE users SET token = ?, time = ? WHERE phone = ?",
      [tokenHash, moment().valueOf(), username]
    );

    res.cookie("auth", tokenHash, {
      httpOnly: true,
      sameSite: "lax",
      secure: false, 
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    console.log("LOGIN SUCCESSFUL");

    return res.status(200).json({
      message: "Login Successfully!",
      status: true,
      data: {
        id_user: user.id_user,
        username: user.phone, 
        name_user: user.name_user,
        money: user.money,
        total_money: user.total_money,
        bonus_money: user.bonus_money,
        level: user.level,
        rank: user.rank,
        code: user.code,
        user_level: user.user_level,
        vip_level: user.vip_level,
        avatar: user.avatar
      },
      token: accessToken
    });

  } catch (error) {
    console.error("LOGIN ERROR:");
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    
    return res.status(500).json({
      status: false,
      message: "Internal Server Error"
    });
  }
};

// LOGOUT API
const logout = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (token) {
      const tokenHash = md5(token);
      await connection.execute(
        "UPDATE users SET token = '' WHERE token = ?",
        [tokenHash]
      );
    }

    return res.status(200).json({
      status: true,
      message: "Logout successful"
    });

  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({
      status: false,
      message: "Internal server error"
    });
  }
};

// AUTH MIDDLEWARE
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        status: false,
        message: "Access token required"
      });
    }

    const tokenHash = md5(token);
    const [users] = await connection.query(
      "SELECT * FROM users WHERE token = ? AND status = 1 AND veri = 1",
      [tokenHash]
    );

    if (users.length === 0) {
      return res.status(403).json({
        status: false,
        message: "Invalid or expired token"
      });
    }

    // Verify JWT token
    const jwtSecret = process.env.JWT_ACCESS_TOKEN;
    if (!jwtSecret) {
      return res.status(500).json({
        status: false,
        message: "Server configuration error"
      });
    }
    
    const decoded = jwt.verify(token, jwtSecret);
    req.user = decoded;
    req.userFullData = users[0];
    next();

  } catch (error) {
    return res.status(403).json({
      status: false,
      message: "Invalid token"
    });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = req.userFullData;
    
    return res.status(200).json({
      status: true,
      message: "Profile retrieved successfully",
      data: {
        id_user: user.id_user,
        username: user.phone, // phone field contains username
        name_user: user.name_user,
        money: user.money,
        total_money: user.total_money,
        bonus_money: user.bonus_money,
        roses_f1: user.roses_f1,
        roses_f: user.roses_f,
        roses_today: user.roses_today,
        level: user.level,
        rank: user.rank,
        code: user.code,
        user_level: user.user_level,
        vip_level: user.vip_level,
        avatar: user.avatar,
        isdemo: user.isdemo,
        time: user.time
      }
    });

  } catch (error) {
    console.error("LOGIN ERROR:", error);
    return res.status(500).json({ status: false, message: "Internal Server Error" });
  }
};

const accountController = {
  register,
  login,
  logout,
  authenticateToken,
  getProfile
};

export default accountController;