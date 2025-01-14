const express = require("express");
const router = express.Router();

router.get("/assetlinks.json", (req: any, res: any) => {
  return res.json([
    // {
    //   relation: [
    //     "delegate_permission/common.handle_all_urls",
    //     "delegate_permission/common.get_login_creds",
    //   ],
    //   target: {
    //     namespace: "web",
    //     site: "https://charmed-deciding-dogfish.ngrok-free.app",
    //   },
    // },
    {
      relation: [
        "delegate_permission/common.handle_all_urls",
        "delegate_permission/common.get_login_creds",
      ],
      target: {
        namespace: "android_app",
        package_name: "com.passkey.example",
        sha256_cert_fingerprints: [
          "FA:C6:17:45:DC:09:03:78:6F:B9:ED:E6:2A:96:2B:39:9F:73:48:F0:BB:6F:89:9B:83:32:66:75:91:03:3B:9C",
        ],
      },
    },
  ]);
});

export default router;
