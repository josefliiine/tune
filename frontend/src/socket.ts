import { io, Socket } from "socket.io-client";

const socket: Socket = io("https://tune-backend-opj9.onrender.com");

export default socket;