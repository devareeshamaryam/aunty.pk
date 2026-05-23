import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ISettings, settingsSchema } from '@repo/db';

const GLOBAL_KEY = 'global';

@Injectable()
export class SettingsService {
  constructor(@InjectModel('Settings') private settingsModel: Model<ISettings>) {}

  async get(): Promise<ISettings> {
    let s = await this.settingsModel.findOne({ key: GLOBAL_KEY });
    if (!s) {
      s = await this.settingsModel.create({ key: GLOBAL_KEY });
    }
    return s;
  }

  async update(patch: Partial<ISettings>): Promise<ISettings> {
    const updated = await this.settingsModel.findOneAndUpdate(
      { key: GLOBAL_KEY },
      { $set: patch },
      { new: true, upsert: true },
    );
    return updated!;
  }

  /** Compute delivery fee for a given items total based on current settings. */
  async computeDeliveryFee(itemsTotal: number): Promise<number> {
    const s = await this.get();
    if (s.deliveryFee.free) return 0;
    if (s.deliveryFee.freeAbove && itemsTotal >= s.deliveryFee.freeAbove) return 0;
    return Math.max(0, s.deliveryFee.amount || 0);
  }
}
