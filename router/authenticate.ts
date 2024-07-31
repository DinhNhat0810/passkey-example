import { verifyAuthenticationResponse } from "@simplewebauthn/server";

// router.js
const express = require("express");
const router = express.Router();
const { generateAuthenticationOptions } = require("@simplewebauthn/server");
const { readJSONFile, writeJSONFile } = require("../db/db.js");
import type {
  VerifiedAuthenticationResponse,
  VerifyAuthenticationResponseOpts,
} from "@simplewebauthn/server";
import base64url from "base64url";
import { generateToken } from "../middlewares/verifyToken";
const jwt = require("jsonwebtoken");

const expectedOrigin = [
  "https://charmed-deciding-dogfish.ngrok-free.app",
  "android:apk-key-hash:-sYXRdwJA3hvue3mKpYrOZ9zSPC7b4mbgzJmdZEDO5w",
];

router.get("/generate-options", async (req: any, res: any) => {
  try {
    const options = await generateAuthenticationOptions({
      rpID: process.env.RP_ID,
      allowCredentials: [],
      userVerification: "preferred",
    });

    req.session.currentChallenge = options.challenge;

    res.json({
      ...options,
    });
  } catch (e: any) {
    console.error(e);
    res.status(400).send({ error: e.message });
  }
});

router.post("/verify", async (req: any, res: any) => {
  try {
    const expectedChallenge = req.session.currentChallenge;
    const users = readJSONFile();
    const user = users.find(
      (user: any) => user.userId === req.body.response.userHandle
    );

    if (!user) {
      return res.status(400).send({
        message: "Không tìm thấy người dùng",
        verified: false,
      });
    }

    const credential = user.devices.find(
      (device: any) => device.credentialID === req.body.id
    );

    if (!credential) {
      return res.status(400).send({
        message: "Không tìm thấy thiết bị",
        verified: false,
      });
    }

    const publicKeyArray = Object.keys(credential.credentialPublicKey).map(
      (key) => credential.credentialPublicKey[key]
    );

    // Tạo Uint8Array từ mảng
    const credentialPublicKey = new Uint8Array(publicKeyArray);

    let verification: VerifiedAuthenticationResponse;
    try {
      const opts: VerifyAuthenticationResponseOpts = {
        response: req.body,
        expectedChallenge: `${expectedChallenge}`,
        expectedOrigin: expectedOrigin,
        expectedRPID: "charmed-deciding-dogfish.ngrok-free.app",
        authenticator: {
          credentialID: credential.credentialID,
          credentialPublicKey: credentialPublicKey,
          counter: credential.counter,
          transports: credential.transports,
        },
      };

      verification = await verifyAuthenticationResponse(opts);
    } catch (error) {
      const _error = error as Error;
      console.error(_error);
      return res.status(400).send({ error: _error.message });
    }

    const { verified, authenticationInfo } = verification;

    if (verified) {
      // Update the authenticator's counter in the DB to the newest count in the authentication
      writeJSONFile(
        users?.map((item: any) => {
          if (item.userId === req.body.response.userHandle) {
            item.devices = item.devices.map((device: any) => {
              if (device.credentialID === req.body.id) {
                device.counter = authenticationInfo.newCounter;
              }
              return device;
            });
          }
          return item;
        })
      );
    }

    req.session.currentChallenge = undefined;

    return res.json({
      verified: true,
      message: "Authenticated user successfully",
      token: generateToken(user.userId),
    });
  } catch (e: any) {
    console.error(e);
    res.status(400).send({ error: e.message });
  }
});

export default router;
