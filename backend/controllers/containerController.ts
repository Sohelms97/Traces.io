import { Request, Response } from "express";
import { ContainerModel, IContainer } from "../models/Container";
import { AuthRequest } from "../middleware/auth.middleware";

export const getContainers = async (req: Request, res: Response) => {
  try {
    const { status, month } = req.query;
    const containers = await ContainerModel.getAll({ status, month });
    res.json({ success: true, data: containers });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getContainer = async (req: Request, res: Response) => {
  try {
    const container = await ContainerModel.findById(req.params.id);
    if (!container) {
      return res.status(404).json({ success: false, message: "Container not found" });
    }
    res.json({ success: true, data: container });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createContainer = async (req: AuthRequest, res: Response) => {
  try {
    const containerData: Partial<IContainer> = {
      ...req.body,
      createdBy: req.user?.id,
      lastModifiedBy: req.user?.id,
    };
    const id = await ContainerModel.create(containerData);
    res.status(201).json({ success: true, data: { id, ...containerData } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateContainer = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id;
    const updateData = {
      ...req.body,
      lastModifiedBy: req.user?.id,
    };
    await ContainerModel.update(id, updateData);
    res.json({ success: true, message: "Container updated successfully" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteContainer = async (req: Request, res: Response) => {
  try {
    await ContainerModel.delete(req.params.id);
    res.json({ success: true, message: "Container deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
