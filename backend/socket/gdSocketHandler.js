const GDSession = require("../models/GDSession");

// ==============================
// GD SOCKET HANDLER
// ==============================

const gdSocketHandler = (io, socket) => {
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
          const response = {
            success: false,
            message:
              "GD room code is required",
          };

          if (typeof callback === "function") {
            return callback(response);
          }

          return socket.emit(
            "gd:error",
            response
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
          const response = {
            success: false,
            message:
              "GD room not found",
          };

          if (typeof callback === "function") {
            return callback(response);
          }

          return socket.emit(
            "gd:error",
            response
          );
        }

        // ==============================
        // CHECK ROOM STATUS
        // ==============================

        if (
          session.status === "Completed" ||
          session.status === "Cancelled"
        ) {
          const response = {
            success: false,
            message:
              "This GD room is no longer active",
          };

          if (typeof callback === "function") {
            return callback(response);
          }

          return socket.emit(
            "gd:error",
            response
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
          const response = {
            success: false,
            message:
              "You are not a participant of this GD room",
          };

          if (typeof callback === "function") {
            return callback(response);
          }

          return socket.emit(
            "gd:error",
            response
          );
        }

        // ==============================
        // PARTICIPANT MUST BE PRESENT
        // ==============================

        if (!participant.isPresent) {
          const response = {
            success: false,
            message:
              "You are not currently present in this GD room",
          };

          if (typeof callback === "function") {
            return callback(response);
          }

          return socket.emit(
            "gd:error",
            response
          );
        }

        // ==============================
        // JOIN SOCKET.IO ROOM
        // ==============================

        await socket.join(roomCode);

        socket.gdRoomCode = roomCode;

        // ==============================
        // NOTIFY OTHER STUDENTS
        // ==============================

        socket
          .to(roomCode)
          .emit(
            "gd:participant-joined",
            {
              user: {
                id: socket.user.id,
                name: socket.user.name,
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
          },
        };

        if (typeof callback === "function") {
          return callback(response);
        }

        socket.emit(
          "gd:joined-room",
          response
        );
      } catch (error) {
        console.error(
          "GD socket join error:",
          error
        );

        const response = {
          success: false,
          message:
            "Failed to join GD realtime room",
        };

        if (typeof callback === "function") {
          return callback(response);
        }

        socket.emit(
          "gd:error",
          response
        );
      }
    }
  );
};

module.exports = gdSocketHandler;