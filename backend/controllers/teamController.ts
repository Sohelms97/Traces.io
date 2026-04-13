import { Request, Response } from "express";
import { CMSContentModel } from "../models/CMSContent";
import { AuthRequest } from "../middleware/auth.middleware";
import sharp from "sharp";
import path from "path";
import fs from "fs";

export const uploadTeamPhoto = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No image file provided" });
    }

    const { id } = req.params; // Member ID
    const section = await CMSContentModel.getBySection('team');
    
    if (!section || !section.data) {
      return res.status(404).json({ success: false, message: "Team section not found" });
    }

    const teamMembers = section.data;
    const memberIndex = teamMembers.findIndex((m: any) => m.id === id);
    
    if (memberIndex === -1) {
      return res.status(404).json({ success: false, message: "Team member not found" });
    }

    const outputName = `team-${id}-${Date.now()}.jpg`;
    const outputPath = path.join(process.cwd(), 'uploads/team', outputName);

    // Ensure directory exists
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    await sharp(req.file.path)
      .resize(400, 400, { fit: 'cover' })
      .jpeg({ quality: 85 })
      .toFile(outputPath);

    // Remove original upload
    fs.unlinkSync(req.file.path);

    const photoUrl = `uploads/team/${outputName}`;
    
    // Delete old photo if exists
    const oldPhoto = teamMembers[memberIndex].image || teamMembers[memberIndex].photo;
    if (oldPhoto && oldPhoto.startsWith('uploads/')) {
      const oldPath = path.join(process.cwd(), oldPhoto);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    // Update member record
    teamMembers[memberIndex].image = photoUrl;
    teamMembers[memberIndex].photo = photoUrl; // Support both field names if used
    
    await CMSContentModel.updateSection('team', teamMembers, req.user?.id);

    res.json({
      success: true,
      message: "Photo updated successfully",
      photoUrl
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
