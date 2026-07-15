import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import Client from "ssh2-sftp-client";

// 카페24 스킨 배포 스크립트
// css/js 는 파일명에 내용 해시를 붙여 올리고, pick-option.html 의 참조도
// 그 파일명으로 바꿔서 올린다. 내용이 바뀌면 파일명도 바뀌어서 캐시 문제를 피함.

const cfg = JSON.parse(readFileSync(".vscode/sftp.json", "utf8"));
const remoteBase = cfg.remotePath || "/";

const assets = [
  "skin1/css/pick-option.css",
  "skin1/js/pick-option-config.js",
  "skin1/js/pick-option-utils.js",
  "skin1/js/pick-option-cafe24-adapter.js",
  "skin1/js/pick-option.js",
];

const pages = [
  "skin1/product/detail.html",
  "skin1/product/detail/01-headcategory.html",
  "skin1/product/detail/02-heading.html",
  "skin1/product/detail/03-image.html",
  "skin1/product/detail/04-summary.html",
  "skin1/product/detail/05-option.html",
  "skin1/product/detail/06-setproduct.html",
  "skin1/product/detail/07-addproduct.html",
  "skin1/product/detail/08-total-action.html",
  "skin1/product/detail/09-tabs.html",
  "skin1/product/detail/10-relation.html",
  "skin1/layout/basic/layout.html",
];

if (!cfg.password || cfg.password.includes("여기에")) {
  console.error(".vscode/sftp.json 에 password 를 입력해주세요");
  process.exit(1);
}

const sftp = new Client();

function remote(local) {
  return path.posix.join(remoteBase, local);
}

function hashName(file) {
  const hash = createHash("md5")
    .update(readFileSync(file))
    .digest("hex")
    .slice(0, 8);
  return file.replace(/\.(css|js)$/, `.${hash}.$1`);
}

try {
  await sftp.connect({
    host: cfg.host,
    port: cfg.port || 22,
    username: cfg.username,
    password: cfg.password,
  });

  let pickHtml = readFileSync("skin1/product/pick-option.html", "utf8");
  const keep = new Set();

  // css/js 를 해시 파일명으로 올리고, pick-option.html 안의 참조를 그 이름으로 바꿈
  for (const file of assets) {
    const hashed = hashName(file);
    const content = readFileSync(file);
    await sftp.put(content, remote(hashed));
    console.log("upload", hashed);

    const from = path.posix.basename(file).replace(/\./g, "\\.");
    const to = path.posix.basename(hashed);
    keep.add(to);
    pickHtml = pickHtml.replace(new RegExp(`${from}(\\?v=\\d+)?`, "g"), to);
  }

  await sftp.put(Buffer.from(pickHtml), remote("skin1/product/pick-option.html"));
  console.log("upload skin1/product/pick-option.html");

  for (const file of pages) {
    await sftp.mkdir(path.posix.dirname(remote(file)), true).catch(() => {});
    await sftp.put(file, remote(file));
    console.log("upload", file);
  }

  // 이번에 안 쓰는 예전 해시 파일 정리
  for (const dir of ["skin1/css", "skin1/js"]) {
    const files = await sftp.list(remote(dir));
    for (const file of files) {
      if (
        /^pick-option[\w-]*\.[0-9a-f]{8}\.(css|js)$/.test(file.name) &&
        !keep.has(file.name)
      ) {
        await sftp.delete(remote(`${dir}/${file.name}`));
      }
    }
  }

  console.log("done");
} catch (error) {
  console.error("deploy failed:", error.message);
  process.exitCode = 1;
} finally {
  await sftp.end();
}
