import { Request, Response } from "express";
import { TraceabilityModel, ITraceability } from "../models/Traceability";
import { ProductModel } from "../models/Product";
import { AuthRequest } from "../middleware/auth.middleware";

export const getTraceabilityByProduct = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    let trace = await TraceabilityModel.findByProductId(productId);
    
    if (!trace) {
      // Create initial traceability record if it doesn't exist
      const initialTrace: Partial<ITraceability> = {
        traceId: `TRC-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        productId,
        overallStatus: 'not_started',
        completionPercent: 0,
        scanCount: 0,
        stages: [
          { stageId: 'origin', stageNumber: 1, stageName: 'Origin', stageIcon: 'MapPin', stageColor: 'green', status: 'pending', showOnWebsite: true },
          { stageId: 'pre_shipment', stageNumber: 2, stageName: 'Pre-Shipment Inspection', stageIcon: 'Search', stageColor: 'blue', status: 'pending', showOnWebsite: true },
          { stageId: 'purchase', stageNumber: 3, stageName: 'Purchase & Payment', stageIcon: 'CreditCard', stageColor: 'yellow', status: 'pending', showOnWebsite: false },
          { stageId: 'shipment', stageNumber: 4, stageName: 'Shipment', stageIcon: 'Ship', stageColor: 'blue', status: 'pending', showOnWebsite: true },
          { stageId: 'customs', stageNumber: 5, stageName: 'Customs Clearance', stageIcon: 'Building', stageColor: 'purple', status: 'pending', showOnWebsite: true },
          { stageId: 'warehouse', stageNumber: 6, stageName: 'Warehouse Receipt', stageIcon: 'Warehouse', stageColor: 'orange', status: 'pending', showOnWebsite: true },
          { stageId: 'quality', stageNumber: 7, stageName: 'Quality Check', stageIcon: 'CheckCircle', stageColor: 'green', status: 'pending', showOnWebsite: true },
          { stageId: 'sales', stageNumber: 8, stageName: 'Sales & Delivery', stageIcon: 'Truck', stageColor: 'blue', status: 'pending', showOnWebsite: true },
        ]
      };
      const id = await TraceabilityModel.create(initialTrace);
      trace = { id, ...initialTrace } as ITraceability;
    }
    
    res.json({ success: true, data: trace });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateTraceability = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    await TraceabilityModel.update(id, {
      ...updateData,
      updatedBy: req.user?.id,
      updatedAt: new Date()
    });
    
    // Also update product's traceabilityStatus if provided
    if (updateData.productId && updateData.overallStatus) {
      const statusMap: Record<string, string> = {
        'not_started': 'Pending',
        'in_progress': 'In Progress',
        'complete': 'Fully Traced'
      };
      
      const product = await ProductModel.findById(updateData.productId);
      if (product) {
        await ProductModel.update(product.id!, { 
          traceStatus: statusMap[updateData.overallStatus] as any 
        });
      }
    }
    
    res.json({ success: true, message: "Traceability data updated successfully" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
