const GDSession = require("../models/GDSession");

// ==============================
// GD SOCKET HANDLER
// ==============================

const gdSocketHandler = (io, socket) => {
  // ==============================
  // HELPER: SEND RESPONSE
  // ==============================

  const sendResponse = (
    callback,
    eventName,
    response
  ) => {
    if (typeof callback === "function") {
      return callback(response);
    }

    socket.emit(eventName, response);
  };

  // ==============================
  // HELPER: VERIFY WEBRTC TARGET
  // ==============================

  const verifyWebRTCTarget = async (
    targetSocketId
  ) => {
    if (!socket.gdRoomCode) {
      return {
        success: false,
        message:
          "Join a GD realtime room before using WebRTC",
      };
    }

    if (!targetSocketId) {
      return {
        success: false,
        message:
          "Target socket ID is required",
      };
    }

    if (targetSocketId === socket.id) {
      return {
        success: false,
        message:
          "You cannot send WebRTC signaling to yourself",
      };
    }

    const targetSocket =
      io.sockets.sockets.get(
        targetSocketId
      );

    if (!targetSocket) {
      return {
        success: false,
        message:
          "Target participant is not connected",
      };
    }

    const roomCode = socket.gdRoomCode;

    const senderInRoom =
      socket.rooms.has(roomCode);

    const targetInRoom =
      targetSocket.rooms.has(roomCode);

    if (!senderInRoom || !targetInRoom) {
      return {
        success: false,
        message:
          "WebRTC signaling is allowed only between participants in the same GD room",
      };
    }

    if (
      targetSocket.gdRoomCode !==
      roomCode
    ) {
      return {
        success: false,
        message:
          "Target participant is not in your GD room",
      };
    }

    return {
      success: true,
      targetSocket,
      roomCode,
    };
  };

  // ==============================
  // JOIN GD REALTIME ROOM
  // ==============================

  socket.on(
    "gd:join-room",
    async (data = {}, callback) => {
      try {
        const userId = socket.user.id;

        const roomCode = String(
          data.roomCode || ""
        )
          .trim()
          .toUpperCase();

        // ==============================
        // VALIDATE ROOM CODE
        // ==============================

        if (!roomCode) {
          return sendResponse(
            callback,
            "gd:error",
            {
              success: false,
              message:
                "GD room code is required",
            }
          );
        }

        // ==============================
        // FIND GD SESSION
        // ==============================

        const session =
          await GDSession.findOne({
            roomCode,
          });

        if (!session) {
          return sendResponse(
            callback,
            "gd:error",
            {
              success: false,
              message:
                "GD room not found",
            }
          );
        }

        // ==============================
        // CHECK ROOM STATUS
        // ==============================

        if (
          session.status ===
            "Completed" ||
          session.status ===
            "Cancelled"
        ) {
          return sendResponse(
            callback,
            "gd:error",
            {
              success: false,
              message:
                "This GD room is no longer active",
            }
          );
        }

        // ==============================
        // VERIFY PARTICIPANT
        // ==============================

        const participant =
          session.participants.find(
            (item) =>
              item.user.toString() ===
              userId.toString()
          );

        if (!participant) {
          return sendResponse(
            callback,
            "gd:error",
            {
              success: false,
              message:
                "You are not a participant of this GD room",
            }
          );
        }

        // ==============================
        // PARTICIPANT MUST BE PRESENT
        // ==============================

        if (!participant.isPresent) {
          return sendResponse(
            callback,
            "gd:error",
            {
              success: false,
              message:
                "You are not currently present in this GD room",
            }
          );
        }

        // ==============================
        // LEAVE OLD GD SOCKET ROOM
        // ==============================

        if (
          socket.gdRoomCode &&
          socket.gdRoomCode !== roomCode
        ) {
          await socket.leave(
            socket.gdRoomCode
          );
        }

        // ==============================
        // JOIN SOCKET.IO ROOM
        // ==============================

        await socket.join(roomCode);

        socket.gdRoomCode = roomCode;

        // ==============================
        // GET EXISTING SOCKET MEMBERS
        // ==============================

        const roomSockets =
          await io
            .in(roomCode)
            .fetchSockets();

        const existingParticipants =
          roomSockets
            .filter(
              (roomSocket) =>
                roomSocket.id !==
                socket.id
            )
            .map((roomSocket) => ({
              socketId:
                roomSocket.id,

              user: {
                id:
                  roomSocket.user?.id,
                name:
                  roomSocket.user?.name,
              },
            }));

        // ==============================
        // NOTIFY OTHER STUDENTS
        // ==============================

        socket
          .to(roomCode)
          .emit(
            "gd:participant-joined",
            {
              socketId: socket.id,

              user: {
                id: socket.user.id,
                name:
                  socket.user.name,
              },
            }
          );

        // ==============================
        // SUCCESS RESPONSE
        // ==============================

        const response = {
          success: true,

          message:
            "Joined GD realtime room successfully",

          room: {
            roomCode:
              session.roomCode,

            topic:
              session.topic,

            status:
              session.status,

            durationMinutes:
              session.durationMinutes,
          },

          currentUser: {
            id: socket.user.id,
            name: socket.user.name,
            socketId: socket.id,
          },

          existingParticipants,
        };

        return sendResponse(
          callback,
          "gd:joined-room",
          response
        );
      } catch (error) {
        console.error(
          "GD socket join error:",
          error
        );

        return sendResponse(
          callback,
          "gd:error",
          {
            success: false,
            message:
              "Failed to join GD realtime room",
          }
        );
      }
    }
  );

  // ==============================
  // WEBRTC OFFER
  // ==============================

  socket.on(
    "webrtc-offer",
    async (data = {}, callback) => {
      try {
        const {
          targetSocketId,
          offer,
        } = data;

        if (!offer) {
          return sendResponse(
            callback,
            "gd:error",
            {
              success: false,
              message:
                "WebRTC offer is required",
            }
          );
        }

        const verification =
          await verifyWebRTCTarget(
            targetSocketId
          );

        if (!verification.success) {
          return sendResponse(
            callback,
            "gd:error",
            verification
          );
        }

        verification.targetSocket.emit(
          "webrtc-offer",
          {
            fromSocketId:
              socket.id,

            fromUser: {
              id: socket.user.id,
              name:
                socket.user.name,
            },

            offer,
          }
        );

        return sendResponse(
          callback,
          "webrtc-offer-sent",
          {
            success: true,
            message:
              "WebRTC offer sent successfully",
          }
        );
      } catch (error) {
        console.error(
          "WebRTC offer error:",
          error
        );

        return sendResponse(
          callback,
          "gd:error",
          {
            success: false,
            message:
              "Failed to send WebRTC offer",
          }
        );
      }
    }
  );

  // ==============================
  // WEBRTC ANSWER
  // ==============================

  socket.on(
    "webrtc-answer",
    async (data = {}, callback) => {
      try {
        const {
          targetSocketId,
          answer,
        } = data;

        if (!answer) {
          return sendResponse(
            callback,
            "gd:error",
            {
              success: false,
              message:
                "WebRTC answer is required",
            }
          );
        }

        const verification =
          await verifyWebRTCTarget(
            targetSocketId
          );

        if (!verification.success) {
          return sendResponse(
            callback,
            "gd:error",
            verification
          );
        }

        verification.targetSocket.emit(
          "webrtc-answer",
          {
            fromSocketId:
              socket.id,

            fromUser: {
              id: socket.user.id,
              name:
                socket.user.name,
            },

            answer,
          }
        );

        return sendResponse(
          callback,
          "webrtc-answer-sent",
          {
            success: true,
            message:
              "WebRTC answer sent successfully",
          }
        );
      } catch (error) {
        console.error(
          "WebRTC answer error:",
          error
        );

        return sendResponse(
          callback,
          "gd:error",
          {
            success: false,
            message:
              "Failed to send WebRTC answer",
          }
        );
      }
    }
  );

  // ==============================
  // WEBRTC ICE CANDIDATE
  // ==============================

  socket.on(
    "webrtc-ice-candidate",
    async (data = {}, callback) => {
      try {
        const {
          targetSocketId,
          candidate,
        } = data;

        if (!candidate) {
          return sendResponse(
            callback,
            "gd:error",
            {
              success: false,
              message:
                "ICE candidate is required",
            }
          );
        }

        const verification =
          await verifyWebRTCTarget(
            targetSocketId
          );

        if (!verification.success) {
          return sendResponse(
            callback,
            "gd:error",
            verification
          );
        }

        verification.targetSocket.emit(
          "webrtc-ice-candidate",
          {
            fromSocketId:
              socket.id,

            fromUser: {
              id: socket.user.id,
              name:
                socket.user.name,
            },

            candidate,
          }
        );

        return sendResponse(
          callback,
          "webrtc-ice-candidate-sent",
          {
            success: true,
            message:
              "ICE candidate sent successfully",
          }
        );
      } catch (error) {
        console.error(
          "WebRTC ICE candidate error:",
          error
        );

        return sendResponse(
          callback,
          "gd:error",
          {
            success: false,
            message:
              "Failed to send ICE candidate",
          }
        );
      }
    }
  );

  // ==============================
  // SOCKET DISCONNECT
  // ==============================

  socket.on("disconnect", () => {
    if (!socket.gdRoomCode) {
      return;
    }

    socket
      .to(socket.gdRoomCode)
      .emit(
        "gd:participant-disconnected",
        {
          socketId: socket.id,

          user: {
            id: socket.user.id,
            name: socket.user.name,
          },
        }
      );
  });
};

module.exports = gdSocketHandler;