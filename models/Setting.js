const mongoose = require("mongoose");

const SettingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    value: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

// 기본 설정값 가져오는 정적 메서드
SettingSchema.statics.getSetting = async function (key, defaultValue = "") {
  const setting = await this.findOne({ key });
  return setting ? setting.value : defaultValue;
};

// 설정값 업데이트 또는 생성하는 정적 메서드
SettingSchema.statics.updateSetting = async function (key, value, description = "") {
  return this.findOneAndUpdate(
    { key },
    { value, description },
    { upsert: true, new: true, runValidators: true }
  );
};

module.exports = mongoose.model("Setting", SettingSchema);
