#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
APP_MAIN="${SCRIPT_DIR}/app/src/main"
BUILD_DIR="${SCRIPT_DIR}/build-direct"

SDK_ROOT="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-/usr/local/lib/android/sdk}}"
if [ ! -d "${SDK_ROOT}" ]; then
  echo "Error: Android SDK not found at ${SDK_ROOT}" >&2
  exit 1
fi

BUILD_TOOLS_DIR="$(ls -d "${SDK_ROOT}/build-tools/"* | sort -V | tail -n 1)"
PLATFORM_DIR="$(ls -d "${SDK_ROOT}/platforms/android-"* | sort -V | tail -n 1)"
ANDROID_JAR="${PLATFORM_DIR}/android.jar"

echo "Using Android SDK: ${SDK_ROOT}"
echo "Using Build Tools: ${BUILD_TOOLS_DIR}"
echo "Using Platform JAR: ${ANDROID_JAR}"

rm -rf "${BUILD_DIR}"
mkdir -p "${BUILD_DIR}/gen" "${BUILD_DIR}/classes"

echo "1. Compiling Android resources with aapt2..."
"${BUILD_TOOLS_DIR}/aapt2" compile \
  --dir "${APP_MAIN}/res" \
  -o "${BUILD_DIR}/res.zip"

echo "2. Linking AndroidManifest.xml, resources, and embedded 10,000-level assets..."
"${BUILD_TOOLS_DIR}/aapt2" link \
  -o "${BUILD_DIR}/unaligned.apk" \
  -I "${ANDROID_JAR}" \
  --manifest "${APP_MAIN}/AndroidManifest.xml" \
  -A "${APP_MAIN}/assets" \
  --java "${BUILD_DIR}/gen" \
  --auto-add-overlay \
  "${BUILD_DIR}/res.zip"

echo "3. Compiling Java sources against Android SDK..."
javac --release 11 \
  -cp "${ANDROID_JAR}" \
  -d "${BUILD_DIR}/classes" \
  "${APP_MAIN}/java/com/cerebra/puzzles/ui/MainActivity.java" \
  $(find "${BUILD_DIR}/gen" -name "*.java")

echo "4. Converting bytecode to Dalvik Executable (classes.dex) with d8..."
"${BUILD_TOOLS_DIR}/d8" \
  --lib "${ANDROID_JAR}" \
  --release \
  --min-api 24 \
  --output "${BUILD_DIR}" \
  $(find "${BUILD_DIR}/classes" -name "*.class")

echo "5. Packaging classes.dex into APK..."
(cd "${BUILD_DIR}" && zip -q -u unaligned.apk classes.dex)

echo "6. Aligning APK on 4-byte boundaries with zipalign..."
"${BUILD_TOOLS_DIR}/zipalign" -p -f 4 \
  "${BUILD_DIR}/unaligned.apk" \
  "${BUILD_DIR}/aligned.apk"

KEYSTORE="${BUILD_DIR}/release.keystore"
echo "7. Generating RSA-2048 Release Keystore..."
keytool -genkeypair -v \
  -keystore "${KEYSTORE}" \
  -alias cerebra \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -storepass cerebra123 \
  -keypass cerebra123 \
  -dname "CN=Cerebra Cognitive Lab, OU=Mobile Engineering, O=Cerebra, L=San Francisco, S=CA, C=US"

RELEASE_APK="${REPO_ROOT}/cerebra-release.apk"
DEBUG_APK="${REPO_ROOT}/cerebra-debug.apk"

echo "8. Signing Release APK (v1 + v2 + v3 schemes) with apksigner..."
"${BUILD_TOOLS_DIR}/apksigner" sign \
  --ks "${KEYSTORE}" \
  --ks-key-alias cerebra \
  --ks-pass pass:cerebra123 \
  --key-pass pass:cerebra123 \
  --v1-signing-enabled true \
  --v2-signing-enabled true \
  --v3-signing-enabled true \
  --out "${RELEASE_APK}" \
  "${BUILD_DIR}/aligned.apk"

cp "${RELEASE_APK}" "${DEBUG_APK}"

echo "9. Verifying APK cryptographic signatures..."
"${BUILD_TOOLS_DIR}/apksigner" verify --verbose "${RELEASE_APK}"

ls -lh "${RELEASE_APK}" "${DEBUG_APK}"
echo "Successfully built and signed ${RELEASE_APK}"
