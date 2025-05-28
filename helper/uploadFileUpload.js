const path         = require('path');
const fs           = require('fs');

// const storage      = async (files, type, directoryName, uuid) => {
//   const frontFile  = files;
//   const uploadDir  = path.join(__dirname, `../public/uploads/${type}/${directoryName}`);
//   await fs.promises.rm(uploadDir, { recursive: true, force: true });
//   await fs.promises.mkdir(uploadDir, { recursive: true });
//   const uploadPath = path.join(uploadDir, frontFile.name.concat("-", uuid));
//   await frontFile.mv(uploadPath);
//   return true;
// };

const storage = async (file, type, directoryName, uuid) => {
  const uploadDir = path.join(__dirname, `../public/uploads/${type}/${directoryName}`);
  await fs.promises.mkdir(uploadDir, { recursive: true });
  const ext = path.extname(file.name);
  const baseName = path.basename(file.name, ext);
  const finalFileName = `${baseName}-${uuid}${ext}`;
  const uploadPath = path.join(uploadDir, finalFileName);
  // Delete existing file with same UUID (if any)
  const existingFiles = await fs.promises.readdir(uploadDir);
  const matchingFile = existingFiles.find(f => f.includes(`-${uuid}`));
  if (matchingFile) {
    await fs.promises.unlink(path.join(uploadDir, matchingFile));
  }
  // Move new file to target path
  await file.mv(uploadPath);
  return true;
};

const getFileName = async (file, type, directoryName, uuid) => {
  const ext       = path.extname(file.name);
  const baseName  = path.basename(file.name, ext);
  return `/${type}/${directoryName}/${baseName}-${uuid}${ext}`;
};

module.exports     = { storage, getFileName };