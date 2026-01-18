const express = require('express');
const http = require('http'); // 引入 http 模块
const WebSocket = require('ws'); // 引入 ws 库
const path = require('path');

const app = express();
const port = 3000;

// 提供静态文件服务 (index.html, CSS, JS 等)
app.use(express.static(path.join(__dirname)));

// 创建 HTTP 服务器
const server = http.createServer(app);

// 创建 WebSocket 服务器，绑定到 HTTP 服务器
const wss = new WebSocket.Server({ server });

let count = 0; // 全局计数器

// 监听 WebSocket 连接事件
wss.on('connection', (ws, req) => {
    console.log('Client connected:', req.socket.remoteAddress);

    // 发送初始计数值给新连接的客户端
    ws.send(JSON.stringify({ type: 'countUpdate', count: count }));

    // 监听来自客户端的消息
    ws.on('message', (data) => {
        try {
            const message = JSON.parse(data);
            if (message.type === 'increment') {
                count++;
                console.log(`Counter incremented to ${count}`);
                // 向所有连接的客户端广播新的计数值
                broadcastCount(count);
            } else if (message.type === 'getCount') {
                 // 发送当前计数值给请求的客户端
                 ws.send(JSON.stringify({ type: 'countUpdate', count: count }));
            } else {
                console.warn('Unknown message type received:', message.type);
            }
        } catch (error) {
             console.error('Error parsing message:', error);
             // 可以选择向客户端发送错误消息
             ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
        }
    });

    // 监听连接关闭事件
    ws.on('close', () => {
        console.log('Client disconnected');
    });

     // 监听连接错误事件
     ws.on('error', (error) => {
         console.error('WebSocket error:', error);
     });
});

// 广播函数：向所有连接的客户端发送消息
function broadcastCount(newCount) {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) { // 确保客户端连接处于打开状态
            client.send(JSON.stringify({ type: 'countUpdate', count: newCount }));
        }
    });
}

// 启动服务器监听
server.listen(port, () => {
    console.log(`WebSocket Server running at http://localhost:${port}/`);
});
