import { Customer, DeliveryPartner } from '../../models/index.js';

/**
 * @desc    Updates user profile or live location coordinates
 * @route   PUT /api/user/update
 * @access  Protected
 */
export const updateUser = async (req, reply) => {
    try {
        // Pulling userId from the token (standardized as req.user.id)
        const userId = req.user.id; 
        const updateData = req.body;

        // 1. Find the user in the database
        let user = await Customer.findById(userId) || await DeliveryPartner.findById(userId);

        if (!user) {
            return reply.status(404).send({ success: false, message: "User not found" });
        }

        // 2. Select the correct model based on role
        const UserModel = user.role === "Customer" ? Customer : DeliveryPartner;

        // 3. Update only profile/tracking data
        // We do NOT update the 'address' string here anymore as we use the Address model
        const updatedUser = await UserModel.findByIdAndUpdate(
            userId,
            { $set: updateData },
            { new: true, runValidators: true }
        ).select("-otp -password"); // Keep it professional: hide sensitive data

        return reply.send({
            success: true,
            message: "User tracking/profile updated successfully",
            user: updatedUser
        });
    } catch (error) {
        return reply.status(500).send({ 
            success: false, 
            message: "Failed to update user", 
            error: error.message 
        });
    }
};
