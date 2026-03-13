const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:5000');

const startTime = Date.now();

ws.on('open', () => {
    console.log('📡 Conectado a OpenClaw');
    console.log('📤 Enviando mensaje de prueba...\n');
    
    const message = {
        type: 'message',
        agent_id: 'user-assistant',
        session_id: 'test-session-' + Date.now(),
        content: 'Hola, ¿cuál es tu nombre y qué puedes hacer?'
    };
    
    ws.send(JSON.stringify(message));
});

ws.on('message', (data) => {
    const elapsed = Date.now() - startTime;
    
    try {
        const parsed = JSON.parse(data);
        console.log('✅ Respuesta recibida:');
        console.log(JSON.stringify(parsed, null, 2));
    } catch (e) {
        console.log('Datos:', data);
    }
    
    console.log('\n════════════════════════════════════════');
    console.log(`⏱️  TIEMPO DE RESPUESTA: ${elapsed}ms`);
    console.log('════════════════════════════════════════\n');
    
    if (elapsed < 5000) console.log('⚡ Respuesta RÁPIDA - Excelente rendimiento');
    else if (elapsed < 15000) console.log('✅ Respuesta NORMAL - Rendimiento aceptable');
    else if (elapsed < 30000) console.log('⚠️  Respuesta LENTA - Considera optimizar');
    else console.log('❌ Respuesta MUY LENTA - Problemas de rendimiento');
    
    ws.close();
    process.exit(0);
});

ws.on('error', (error) => {
    console.error('❌ Error:', error.message);
    process.exit(1);
});

ws.on('close', () => {
    console.log('\n📴 Conexión cerrada');
});

setTimeout(() => {
    console.error('❌ Timeout: No se recibió respuesta en 120 segundos');
    ws.close();
    process.exit(1);
}, 120000);
