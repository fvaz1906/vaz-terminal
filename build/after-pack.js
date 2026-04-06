const path = require("path");

module.exports = async (context) => {
  if (context.electronPlatformName !== "win32") {
    return;
  }

  const executableName = `${context.packager.appInfo.productFilename}.exe`;
  const executablePath = path.join(context.appOutDir, executableName);
  const iconPath = path.join(__dirname, "..", "assets", "icon.ico");
  const { rcedit } = await import("rcedit");

  await rcedit(executablePath, {
    icon: iconPath,
    "version-string": {
      ProductName: "Vaz Terminal",
      FileDescription: "Vaz Terminal",
      InternalName: "Vaz Terminal",
      OriginalFilename: executableName
    }
  });
};
