<template>
  <div class="">
    <url-form @connect="handleConnect" />

    <request-section @message-received="handleMessageReceived" @message-sent="handleMessageSent"
      @connection-status="handleConnectionStatus" />
    <response-section :response="responseData" :messages="messages" />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import RequestSection from '../components/api-test/RequestSection.vue';
import ResponseSection from '../components/api-test/ResponseSection.vue';

const responseData = ref(null);
const messages = ref([]);

function handleMessageReceived(message) {
  messages.value.unshift(message);
}

function handleMessageSent(message) {
  messages.value.unshift(message);
}

function handleConnectionStatus(status) {
  if (status.connected) {
    messages.value = []; // 새 연결 시 메시지 초기화
  }
  console.log(messages);
  // 연결 상태 메시지
  messages.value.unshift({
    content: status.message,
    timestamp: new Date().toLocaleTimeString(),
    type: status.connected ? 'connected' : 'disconnected',
  });
}
</script>
