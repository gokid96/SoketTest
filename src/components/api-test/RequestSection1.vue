<!-- components/api-test/RequestSection.vue -->
<template>
  <div class="px-1 border-b border-gray-700 md:min-w-2xl">
    <form @submit.prevent="connect">
      <h2 class="text-xl flex items-center mb-2 pl-2">
        Request
      </h2>




      <!-- 프로토콜 선택 -->
      <div class="flex gap-2 mb-4 px-2">
        <label class="flex items-center cursor-pointer">
          <input type="radio" v-model="protocolType" value="websocket" name="protocol" class="mr-2">
          <span class="text-sm text-gray-700 dark:text-gray-300">WebSocket</span>
        </label>
        <label class="flex items-center cursor-pointer">
          <input type="radio" v-model="protocolType" value="stomp" name="protocol" class="mr-2">
          <span class="text-sm text-gray-700 dark:text-gray-300">STOMP</span>
        </label>
      </div>


      <!-- URL 입력 -->
      <div class="flex flex-col mb-4 sm:flex-row px-2 gap-x-1.5 gap-y-2">

        <input type="text" v-model="url"
          :placeholder="protocolType === 'stomp' ? 'ws://localhost:8080/ws' : 'ws://localhost:8080/websocket'" class="dark:bg-dark-900 h-11 w-full border border-gray-600
                bg-transparent py-2.5 pl-3 pr-14 text-sm text-gray-800 shadow-theme-xs
                placeholder:text-gray-400 dark:border-gray-800 dark:bg-gray-900
                dark:bg-white/[0.03] dark:text-white/90 dark:placeholder:text-white/30
                dark:focus:border-brand-800" />
        <button type="submit" class="whitespace-nowrap border border-gray-600 bg-gray-50 px-5 py-2 text-sm text-gray-700 hover:bg-gray-100
                dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-300
                dark:hover:bg-white/[0.05]">
          {{ isConnected ? 'Disconnect' : 'Connect' }}
        </button>
      </div>
    </form>

    <!-- STOMP 추가 설정 -->
    <div v-if="protocolType === 'stomp'" class="mb-4 px-2">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
        <input v-model="stompDestination" placeholder="Destination (e.g., /app/chat)" class="h-9 border border-gray-600 bg-transparent px-3 text-sm text-gray-800
                dark:border-gray-800 dark:bg-gray-900 dark:text-white/90
                placeholder:text-gray-400 dark:placeholder:text-white/30" />
        <input v-model="stompSubscription" placeholder="Subscribe to (e.g., /topic/messages)" class="h-9 border border-gray-600 bg-transparent px-3 text-sm text-gray-800
                dark:border-gray-800 dark:bg-gray-900 dark:text-white/90
                placeholder:text-gray-400 dark:placeholder:text-white/30" />
      </div>
      <button v-if="isConnected && stompClient" @click="subscribeToTopic" :disabled="!stompSubscription" class="text-xs px-3 py-1 border border-gray-600 bg-gray-50 text-gray-700 hover:bg-gray-100
              dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-300
              dark:hover:bg-white/[0.05] disabled:opacity-50">
        Subscribe
      </button>
    </div>

    <section class="mb-4 px-2 dark:border-gray-800 rounded-lg">
      <!-- 메시지 입력 영역 -->
      <div class="flex flex-col mb-4 gap-y-2">
        <div class="border border-gray-600 min-h-36 max-h-36 min-w-[200px] overflow-auto p-2
                dark:bg-gray-900 dark:text-white/90" contenteditable="true" @input="handleMessageInput"
          ref="messageEditor">
        </div>

        <div class="flex gap-2">
          <button @click="sendMessage()" :disabled="!isConnected" class="ml-auto border px-8 py-2 border-gray-600 bg-gray-50 text-sm text-gray-700 hover:bg-gray-100
                  dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-300 dark:hover:bg-white/[0.05]
                  disabled:opacity-50 disabled:cursor-not-allowed">
            Send
          </button>

          <!-- STOMP 전용 기능 -->
          <button v-if="protocolType === 'stomp' && isConnected" @click="clearMessageEditor" class="border px-4 py-2 border-gray-600 bg-gray-50 text-sm text-gray-700 hover:bg-gray-100
                  dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-300 dark:hover:bg-white/[0.05]">
            Clear
          </button>
        </div>
      </div>
    </section>

    <!-- 연결 상태 표시 -->
    <div class="px-2 mb-2">
      <span :class="connectionStatusClass">
        {{ connectionStatus }}
      </span>
      <span v-if="protocolType === 'stomp' && isConnected" class="ml-4 text-xs text-gray-500">
        Protocol: STOMP | Subscriptions: {{ subscriptions.length }}
      </span>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const emit = defineEmits(['message-received', 'message-sent', 'connection-status']);
const url = ref('');
const socket = ref(null);
const protocolType = ref('websocket');
const isConnected = ref(false);
const isConnecting = ref(false);
const messageText = ref('');
const messageEditor = ref(null); // 수정: 'messageEditor' → null

// WebSocket 연결 함수
function connect() {
  if (isConnected.value) {
    disconnect();
    return;
  }

  if (!url.value.trim()) {
    alert('URL을 입력해주세요.');
    return;
  }

  isConnecting.value = true;

  try {
    socket.value = new WebSocket(url.value);

    socket.value.onopen = (event) => {
      isConnected.value = true;
      isConnecting.value = false;
      emit('connection-status', { connected: true, message: 'Connected to server' }); // 여기에 emit 추가
      console.log('WebSocket 연결됨:', event);
    };

    socket.value.onmessage = (event) => {
      console.log('메시지 받음:', event.data);
      emit('message-received', {
        content: event.data,
        timestamp: new Date().toLocaleTimeString(),
        type: 'received'
      });
    };

    socket.value.onclose = (event) => {
      isConnected.value = false;
      isConnecting.value = false;
      emit('connection-status', { connected: false, message: 'Disconnected from server' });
      console.log('WebSocket 연결 닫힘:', event);
    };

    socket.value.onerror = (error) => {
      isConnected.value = false;
      isConnecting.value = false;
      emit('connection-status', { connected: false, message: 'Connection error' });
      console.error('WebSocket 오류:', error);
    };

  } catch (error) {
    isConnecting.value = false;
    emit('connection-status', { connected: false, message: 'Connection failed' });
    console.error('연결 생성 실패:', error);
  }
}

// WebSocket 연결 해제 함수
function disconnect() {
  if (socket.value) {
    socket.value.close();
    socket.value = null;
  }
}

// 메시지 전송 함수
function sendMessage() {
  if (!isConnected.value || !messageText.value.trim()) {
    return;
  }

  try {
    socket.value.send(messageText.value);
    emit('message-sent', {
      content: messageText.value,
      timestamp: new Date().toLocaleTimeString(),
      type: 'sent'
    });
    console.log('메시지 전송:', messageText.value);
    messageText.value = '';


    // contenteditable 영역 비우기
    // if (messageEditor.value) {
    //   messageEditor.value.innerText = '';
    // }
  } catch (error) {
    console.error('메시지 전송 실패:', error);
  }

}

// 메시지 입력 핸들러
function handleMessageInput(event) {
  messageText.value = event.target.innerText;
}


</script>
