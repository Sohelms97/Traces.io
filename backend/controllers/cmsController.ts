import { Request, Response } from "express";
import { CMSContentModel } from "../models/CMSContent";
import { AuthRequest } from "../middleware/auth.middleware";

export const getCMSSection = async (req: Request, res: Response) => {
  try {
    const section = await CMSContentModel.getBySection(req.params.section);
    if (!section) {
      return res.json({ success: true, data: {} });
    }
    res.json({ success: true, data: section.data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateCMSSection = async (req: AuthRequest, res: Response) => {
  try {
    const { section } = req.params;
    await CMSContentModel.updateSection(section, req.body, req.user?.id);
    res.json({ success: true, message: `Section ${section} updated successfully` });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllCMS = async (req: Request, res: Response) => {
  try {
    const all = await CMSContentModel.getAll();
    res.json({ success: true, data: all });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
