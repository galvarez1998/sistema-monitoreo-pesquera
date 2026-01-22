import io from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:3000';

let socket = null;

export const connectSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });
  }

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const subscribeTank = (tankId) => {
  if (socket) {
    socket.emit('subscribe_tank', tankId);
  }
};

export const unsubscribeTank = (tankId) => {
  if (socket) {
    socket.emit('unsubscribe_tank', tankId);
  }
};

export const onSensorReading = (callback) => {
  if (socket) {
    socket.on('sensor_reading', callback);
  }
};

export const onNewAlert = (callback) => {
  if (socket) {
    socket.on('new_alert', callback);
  }
};

export const onAlertResolved = (callback) => {
  if (socket) {
    socket.on('alert_resolved', callback);
  }
};

export const offSensorReading = () => {
  if (socket) {
    socket.off('sensor_reading');
  }
};

export const offNewAlert = () => {
  if (socket) {
    socket.off('new_alert');
  }
};

export const offAlertResolved = () => {
  if (socket) {
    socket.off('alert_resolved');
  }
};

export default {
  connectSocket,
  disconnectSocket,
  subscribeTank,
  unsubscribeTank,
  onSensorReading,
  onNewAlert,
  onAlertResolved,
  offSensorReading,
  offNewAlert,
  offAlertResolved,
};
