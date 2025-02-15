const ConnectionRequest = require("../models/ConnectionRequest");
const User = require("../models/User");

exports.requestSendInterested = async (req, res) => { 
    try {
        // this is userid whose is want to send request -> login account
        const fromUserId = req.user._id;
        const toUserId = req.params.toUserId;
        const status = req.params.status;

        console.log(fromUserId);

        // user can not send request to himself
        if (fromUserId.equals(toUserId)) {
            return res.status(400).json({ message: "You can't send request to yourself" });
        }

        // allowed status
        const allowedStatus = ["ignored", "interested"];
        if (!allowedStatus.includes(status)) {
            return res.status(400).json({ message: "Invalid status" });
        }

        // user is exist or not in our database
        const userTo = await User.findById(toUserId);
        if (!userTo) {
            return res.status(404).json({ message: "User not found" });
        }

        // check if user is already connected or not
        const existingConnectionRequest = await ConnectionRequest.findOne({
            $or: [
                { fromUserId, toUserId },
                { fromUserId: toUserId, toUserId: fromUserId },
            ]
        });
        if (existingConnectionRequest) {
            return res.status(400).json({ message: "You have already sent a request to this user" });
        }


        const connectionRequest = new ConnectionRequest({
            fromUserId,
            toUserId,
            status,
        })


        const data = await connectionRequest.save();

        return res.status(200).json({
            success: true,
            data,
            message: `${req.user.firstName} is ${status} in ${userTo.firstName}`,
        })

    } catch (error) {
       return res.status(400).json({
            success: false,
            message: error.message,
        })
    }
}

exports.requestReview = async (req, res) => {
    try {

        const loggedInUser = req.user; // loggedInId = toUseerId -> we want accept or rejected  the request
        const {status, requestId } = req.params;
        console.log(status);

        const allowedStatus = ["accepted", "rejected"];
        if (!allowedStatus.includes(status)) {
            return res.status(400).json({ message: "Invalid status" });
        }

        // check if the request exists
        const connectionRequest = await ConnectionRequest.findOne({
            fromUserId: requestId,
            toUserId: loggedInUser._id,
            status: "interested"
        });
        if (!connectionRequest) {
            return res.status(400).json({ message: "Connection request not found" });
        }

        connectionRequest.status = status;
        const data = await connectionRequest.save();

        return res.status(200).json({
            success: true,
            data,
            message: `connection request ${status}`,
        })

    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        })
    }
}