import { ISetting } from "@mdblog/shared/src/types/setting.interface";
import { Document, model, Model, Schema } from "mongoose";

interface ISettingDocument extends Omit<ISetting, "id">, Document {}
interface ISettingModel extends Model<ISettingDocument> {
  getSetting(key: string, defaultValue?: string): Promise<string>;
  updateSetting(key: string, value: string): Promise<ISettingDocument>;
}

const SettingSchema = new Schema<ISettingDocument>(
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

SettingSchema.statics.getSetting = async function (key: string, defaultValue: string = ""): Promise<string> {
  const setting = await this.findOne({ key });
  return setting ? setting.value : defaultValue;
};

SettingSchema.statics.updateSetting = async function (
  key: string,
  value: string,
  description: string = ""
): Promise<ISettingDocument> {
  return this.findOneAndUpdate({ key }, { value, description }, { upsert: true, new: true, runValidators: true });
};

const SettingModel = model<ISettingDocument, ISettingModel>("Setting", SettingSchema);

export { ISettingDocument, SettingModel };
