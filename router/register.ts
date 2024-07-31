import { verifyRegistrationResponse } from "@simplewebauthn/server";

// router.js
const express = require("express");
const router = express.Router();
const { generateRegistrationOptions } = require("@simplewebauthn/server");
const { isoBase64URL } = require("@simplewebauthn/server/helpers");
const { readJSONFile, writeJSONFile } = require("../db/db.js");
import type {
  GenerateAuthenticationOptionsOpts,
  GenerateRegistrationOptionsOpts,
  VerifiedAuthenticationResponse,
  VerifiedRegistrationResponse,
  VerifyAuthenticationResponseOpts,
  VerifyRegistrationResponseOpts,
} from "@simplewebauthn/server";

import type {
  AuthenticatorDevice,
  RegistrationResponseJSON,
} from "@simplewebauthn/types";

const jwt = require("jsonwebtoken");

import { isoUint8Array } from "@simplewebauthn/server/helpers";
import base64url from "base64url";

const expectedOrigin = [
  "https://charmed-deciding-dogfish.ngrok-free.app",
  "android:apk-key-hash:-sYXRdwJA3hvue3mKpYrOZ9zSPC7b4mbgzJmdZEDO5w",
];

router.post("/generate-options", async (req: any, res: any) => {
  const { username, displayName } = req.body;
  try {
    const users = readJSONFile();

    const user = users.find((user: any) => user.username === username);
    const excludeCredentials: any[] = [];

    if (user) {
      for (const device of user.devices) {
        excludeCredentials.push({
          id: device.credentialID,
          type: "public-key",
          transports: device.transports,
        });
      }
    }

    const userID = isoUint8Array.fromUTF8String(username);

    const options = await generateRegistrationOptions({
      rpName: process.env.RP_NAME,
      rpID: process.env.RP_ID,
      userID: userID,
      userName: username,
      userDisplayName: displayName || "",
      attestationType: "none",
      excludeCredentials,
      authenticatorSelection: {
        residentKey: "required",
        userVerification: "required",
      },
      supportedAlgorithmIDs: [-7, -257],
    });

    req.session.challenge = options.challenge;

    res.json({
      ...options,
      pass_key_userID: options.user.id,
      username: options.user.name,
      displayName: options.user.displayName,
    });
  } catch (e: any) {
    console.error(e);
    res.status(400).send({ error: e.message });
  }
});

router.post("/verify", async (req: any, res: any) => {
  try {
    let verification: VerifiedRegistrationResponse;

    const opts: VerifyRegistrationResponseOpts = {
      response: req.body,
      expectedChallenge: `${req.session.challenge}`,
      expectedOrigin: expectedOrigin,
      expectedRPID: process.env.RP_ID,
    };
    verification = await verifyRegistrationResponse(opts);

    const { verified, registrationInfo } = verification;

    if (verified && registrationInfo) {
      // Đọc dữ liệu hiện có từ file JSON
      const users = readJSONFile();

      // Lấy thông tin từ đối tượng đăng ký
      const { credentialPublicKey, credentialID, counter } = registrationInfo;

      const newAuthenticatorDevice = {
        credentialPublicKey,
        credentialID,
        counter,
        transports: req.body.response.transports,
      };

      const userId = req.body.pass_key_userID;
      // Tạo cấu trúc dữ liệu mới cho người dùng
      const newUser = {
        userId: userId,
        username: req.body.username,
        displayName: req.body.displayName || "",
        devices: [newAuthenticatorDevice],
      };

      // Nếu người dùng chưa tồn tại, thêm mới
      if (users?.length === 0 || !users) {
        users.push(newUser);
      } else {
        const user = users?.find((user: any) => user?.userId === userId);

        if (!user) {
          users.push(newUser);
        }

        // Nếu người dùng đã tồn tại, cập nhật thông tin mới
        if (user) {
          // Tìm thiết bị xác thực đã đăng ký trước đó
          const existingDevice = user.devices.find(
            (device: any) => device.credentialID === credentialID
          );
          // Nếu thiết bị chưa tồn tại, thêm mới
          if (!existingDevice) {
            user.devices.push(newAuthenticatorDevice);
          }

          console.log("Thiết bị đã được đăng ký trước đó.");

          return res.json({
            verified: true,
            message: "Thiết bị đã được đăng ký trước đó.",
          });
        }
      }

      // Ghi dữ liệu đã cập nhật vào file JSON
      writeJSONFile(users);

      console.log("Registration verified and data saved successfully.");

      return res.json({
        verified: true,
        message: "Registration verified and data saved successfully.",
        registrationInfo: registrationInfo,
        token: jwt.sign(
          {
            data: req.body.username,
          },
          "secret",
          { expiresIn: "1h" }
        ),
      });
    } else {
      return res.status(400).send({
        error: "Verification failed or registration info is missing.",
      });
    }
  } catch (e: any) {
    console.error(e);
    res.status(400).send({ error: e.message });
  }
});

router.get("/users", async (req: any, res: any) => {
  const data = readJSONFile();
  res.json(data);
});

export default router;
