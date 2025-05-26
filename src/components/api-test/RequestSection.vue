<template>
  <div class="px-1 border-b border-gray-700 md:min-w-2xl">
    <form @submit.prevent="connect">
      <h2 class="text-xl flex items-center mb-2 pl-2">
        Request
      </h2>

      <!-- 프로토콜 선택 -->
      <div class="flex gap-2 mb-4 px-2">
        <label class="flex items-center cursor-pointer">
          <input type="radio" v-model="protocolType" value="websocket" name="protocol" :disabled="isConnecting"
            class="mr-2">
          <span class="text-sm text-gray-700 dark:text-gray-300">WebSocket</span>
        </label>
        <label class="flex items-center cursor-pointer">
          <input type="radio" v-model="protocolType" value="stomp" name="protocol" :disabled="isConnecting"
            class="mr-2">
          <span class="text-sm text-gray-700 dark:text-gray-300">STOMP</span>
        </label>
      </div>


      <!-- URL 입력 -->
      <div class="flex flex-col mb-4 sm:flex-row px-2 gap-x-1.5 gap-y-2">
        <input type="text" v-model="url"
          :placeholder="protocolType === 'stomp' ? 'ws://localhost:8080/ws' : 'ws://localhost:8080/ws'" class="dark:bg-dark-900 h-11 w-full border border-gray-600
                bg-transparent py-2.5 px-3 pr-14 text-sm text-gray-800 shadow-theme-xs
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
    <div v-if="protocolType === 'stomp'" class="mb-4 px-2 transition-all duration-200">
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




        <!-- <div class="border border-gray-600 px-3 min-h-45  max-h-45 min-w-[200px] overflow-y-auto
                dark:bg-gray-900 dark:text-white/90" contenteditable="true" @input="handleMessageInput"
          ref="messageEditor">
        </div> -->


        <div class="monaco-container border  border-gray-600 ">
          <MonacoEditor class=" min-h-45  max-h-45" v-model:value="messageText" :language="editorLanguage"
            :options="editorOptions" @change="handleEditorChange" @keydown="handleKeyDown" />
        </div>



        <div class="flex gap-2">
          <button @click="sendMessage()" :disabled="!isConnected || !messageText.trim()" class="ml-auto border px-8 py-2 border-gray-600 bg-gray-50 text-sm text-gray-700 hover:bg-gray-100
                  dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-300 dark:hover:bg-white/[0.05]
                  disabled:opacity-50 disabled:cursor-not-allowed">
            Send
          </button>

          <!-- Clear 버튼 -->
          <!-- <button @click="clearMessageEditor" :disabled="!messageText.trim()" class="border px-4 py-2 border-gray-600 bg-gray-50 text-sm text-gray-700 hover:bg-gray-100
                  dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-300 dark:hover:bg-white/[0.05]
                  disabled:opacity-50 disabled:cursor-not-allowed">
            Clear
          </button> -->
        </div>
      </div>
    </section>

    <!-- 연결 상태 표시 -->
    <!-- <div class="px-2 mb-2">
      <span :class="connectionStatusClass">
        {{ connectionStatus }}
      </span>
      <span v-if="protocolType === 'stomp' && isConnected" class="ml-4 text-xs text-gray-500">
        Protocol: STOMP | Subscriptions: {{ subscriptions.length }}
      </span>
    </div> -->
  </div>
</template>

<script setup>
import { watch, ref, onUnmounted, computed } from 'vue';
import { Client } from '@stomp/stompjs';
import MonacoEditor from 'monaco-editor-vue3';


const editorLanguage = ref('json'); // 'json', 'javascript', 'plaintext' 등


const emit = defineEmits(['message-received', 'message-sent', 'connection-status']);

// 기본 설정
const protocolType = ref('websocket'); // 기본값: websocket
const url = ref('');
const isConnected = ref(false);
const isConnecting = ref(false);
const messageText = ref('');
// const messageEditor = ref(null);

// WebSocket 관련
const socket = ref(null);

// STOMP 관련
const stompClient = ref(null);
const stompDestination = ref('/app/chat');
const stompSubscription = ref('/topic/messages');
const subscriptions = ref([]);

//  핵심 개선: protocolType 변경 감지
watch(protocolType, (newProtocol, oldProtocol) => {
  emit('connection-change', {
    connected: !false,
  });
  // 초기 로딩이 아니고, 연결된 상태일 때만 실행
  if (oldProtocol && isConnected.value) {
    disconnect();
  }

});

// 에디터 옵션
const editorOptions = computed(() => ({
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  wordWrap: 'on',
  lineNumbers: 'on',
  folding: false,
  lineDecorationsWidth: 10,
  lineNumbersMinChars: 2,
  renderLineHighlight: 'none',
  scrollbar: {
    vertical: 'auto',
    horizontal: 'auto',
    verticalScrollbarSize: 8,
    horizontalScrollbarSize: 8
  },
  overviewRulerLanes: 0,
  hideCursorInOverviewRuler: true,
  overviewRulerBorder: false,
  // fontSize: 12,
  // fontFamily: 'JetBrains Mono, Monaco, Consolas, monospace',
  tabSize: 2,
  insertSpaces: true,
  automaticLayout: true,
  formatOnPaste: true,
  formatOnType: true,
  suggest: {
    showKeywords: false,
    showSnippets: false
  }
}));

function handleEditorChange(value) {
  messageText.value = value;
  console.log('Editor content changed:', value);
}

function handleKeyDown(event) {
  // Ctrl+Enter 또는 Cmd+Enter로 메시지 전송
  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
    event.preventDefault();
    sendMessage();
  }
}

// 연결 상태 표시
// const connectionStatus = computed(() => {
//   if (isConnecting.value) return 'Connecting...';
//   if (isConnected.value) return `Connected (${protocolType.value.toUpperCase()})`;
//   return 'Disconnected';
// });

// const connectionStatusClass = computed(() => ({
//   'text-green-600 dark:text-green-400': isConnected.value,
//   'text-yellow-600 dark:text-yellow-400': isConnecting.value,
//   'text-red-600 dark:text-red-400': !isConnected.value && !isConnecting.value,
//   'text-sm font-medium': true
// }));

// 연결
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

  if (protocolType.value === 'stomp') {
    connectStomp();
  } else {
    connectWebSocket();
  }
}

// 일반 WebSocket 연결
function connectWebSocket() {
  try {
    socket.value = new WebSocket(url.value);

    socket.value.onopen = (event) => {
      isConnected.value = true;
      isConnecting.value = false;
      emit('connection-status', {
        connected: true,
        message: 'Connected to WebSocket server',
        protocol: 'websocket'
      });
      console.log('WebSocket 연결됨:', event);
    };

    socket.value.onmessage = (event) => {
      console.log('WebSocket 메시지 받음:', event.data);
      emit('message-received', {
        content: event.data,
        timestamp: new Date().toLocaleTimeString(),
        type: 'received',
        protocol: 'websocket'
      });
    };

    socket.value.onclose = (event) => {
      isConnected.value = false;
      isConnecting.value = false;
      emit('connection-status', {
        connected: false,
        message: 'WebSocket disconnected',
        protocol: 'websocket'
      });
      console.log('WebSocket 연결 닫힘:', event);
    };

    socket.value.onerror = (error) => {
      isConnected.value = false;
      isConnecting.value = false;
      emit('connection-status', {
        connected: false,
        message: 'WebSocket connection error',
        protocol: 'websocket'
      });
      console.error('WebSocket 오류:', error);
    };

  } catch (error) {
    isConnecting.value = false;
    emit('connection-status', {
      connected: false,
      message: 'WebSocket connection failed',
      protocol: 'websocket'
    });
    console.error('WebSocket 연결 생성 실패:', error);
  }
}

// STOMP 연결
function connectStomp() {
  try {
    stompClient.value = new Client({
      brokerURL: url.value,
      connectHeaders: {},
      debug: (str) => {
        console.log('STOMP Debug:', str);
      },
      reconnectDelay: 5000,

      onConnect: (frame) => {
        console.log('STOMP 연결 성공:', frame);
        isConnected.value = true;
        isConnecting.value = false;
        emit('connection-status', {
          connected: true,
          message: 'Connected to ' + url.value,
          protocol: 'stomp'
        });

        // 🔥 핵심: 연결 후 잠시 대기 후 구독 (안정성 향상)
        if (stompSubscription.value) {
          setTimeout(() => {
            if (isConnected.value && stompClient.value) {
              subscribeToTopic();
            }
          }, 100); // 100ms 대기
        }
      },

      onDisconnect: () => {
        console.log('STOMP 연결 해제');
        isConnected.value = false;
        isConnecting.value = false;

        // 🔥 구독 정리
        subscriptions.value.forEach(sub => {
          try {
            sub.subscription?.unsubscribe();
          } catch (error) {
            console.error('onDisconnect 구독 해제 실패:', error);
          }
        });
        subscriptions.value = [];

        emit('connection-status', {
          connected: false,
          message: 'STOMP disconnected',
          protocol: 'stomp'
        });
      },

      onStompError: (frame) => {
        console.error('STOMP 에러:', frame.headers['message']);
        console.error('자세한 내용:', frame.body);
        isConnected.value = false;
        isConnecting.value = false;

        // 🔥 에러 시에도 구독 정리
        subscriptions.value.forEach(sub => {
          try {
            sub.subscription?.unsubscribe();
          } catch (error) {
            console.error('onStompError 구독 해제 실패:', error);
          }
        });
        subscriptions.value = [];

        emit('connection-status', {
          connected: false,
          message: `STOMP error: ${frame.headers['message']}`,
          protocol: 'stomp'
        });
      },

      onWebSocketError: (error) => {
        console.error('STOMP WebSocket 에러:', error);
        isConnected.value = false;
        isConnecting.value = false;
      }
    });

    stompClient.value.activate();

  } catch (error) {
    isConnecting.value = false;
    emit('connection-status', {
      connected: false,
      message: 'STOMP connection failed',
      protocol: 'stomp'
    });
    console.error('STOMP 연결 생성 실패:', error);
  }
}

// 연결 해제
function disconnect() {
  console.log('Disconnecting...', {
    isConnected: isConnected.value,
    isConnecting: isConnecting.value,
    protocol: protocolType.value
  });

  // 연결되지 않은 상태면 일찍 리턴
  if (!isConnected.value && !isConnecting.value) {
    return;
  }

  if (protocolType.value === 'stomp' && stompClient.value) {
    // 핵심: 구독을 먼저 개별적으로 해제
    subscriptions.value.forEach(sub => {
      try {
        console.log('구독 해제:', sub.destination, sub.id);
        sub.subscription?.unsubscribe(); // 실제 구독 객체 해제
      } catch (error) {
        console.error('구독 해제 실패:', error);
      }
    });

    // 배열 비우기
    subscriptions.value = [];

    // STOMP 클라이언트 비활성화
    stompClient.value.deactivate();
    stompClient.value = null;
  } else if (socket.value) {
    socket.value.close();
    socket.value = null;
  }

  isConnected.value = false;
  isConnecting.value = false;

  console.log('Disconnected successfully');
}


// 메시지 전송
function sendMessage() {
  if (!isConnected.value || !messageText.value.trim()) {
    return;
  }

  try {
    if (protocolType.value === 'stomp') {
      sendStompMessage();
    } else {
      sendWebSocketMessage();
    }
  } catch (error) {
    console.error('메시지 전송 실패:', error);
  }
}

// WebSocket 메시지 전송
function sendWebSocketMessage() {
  socket.value.send(messageText.value);
  emit('message-sent', {
    content: messageText.value,
    timestamp: new Date().toLocaleTimeString(),
    type: 'sent',
    protocol: 'websocket'
  });
  console.log('WebSocket 메시지 전송:', messageText.value);
  // clearMessage();
}

// STOMP 메시지 전송
function sendStompMessage() {
  if (!stompDestination.value) {
    alert('Destination을 입력해주세요.');
    return;
  }

  let messageBody;
  try {
    // JSON 형태로 파싱 시도
    messageBody = JSON.parse(messageText.value);
  } catch {
    // 일반 텍스트로 처리
    messageBody = messageText.value;
  }

  stompClient.value.publish({
    destination: stompDestination.value,
    body: typeof messageBody === 'string' ? messageBody : JSON.stringify(messageBody)
  });

  emit('message-sent', {
    content: messageText.value,
    destination: stompDestination.value,
    timestamp: new Date().toLocaleTimeString(),
    type: 'sent',
    protocol: 'stomp'
  });
  console.log('STOMP 메시지 전송:', messageText.value, 'to', stompDestination.value);
  // clearMessage();
}

// STOMP 토픽 구독
function subscribeToTopic() {
  if (!stompClient.value || !stompSubscription.value) return;

  // 이미 구독된 토픽인지 확인
  const alreadySubscribed = subscriptions.value.some(
    sub => sub.destination === stompSubscription.value
  );

  if (alreadySubscribed) {
    console.log('이미 구독된 토픽:', stompSubscription.value);
    return;
  }

  try {
    const subscription = stompClient.value.subscribe(stompSubscription.value, (message) => {
      console.log('STOMP 메시지 받음:', message.body);
      emit('message-received', {
        content: message.body,
        destination: stompSubscription.value,
        timestamp: new Date().toLocaleTimeString(),
        type: 'received',
        protocol: 'stomp'
      });
    });

    // 🔥 핵심: 실제 구독 객체도 함께 저장
    subscriptions.value.push({
      id: subscription.id,
      destination: stompSubscription.value,
      subscription: subscription  // 👈 실제 구독 객체 저장
    });

    console.log('구독 완료:', stompSubscription.value, '총 구독 수:', subscriptions.value.length);
  } catch (error) {
    console.error('구독 실패:', error);
  }
}

// 메시지 입력 핸들러
// function handleMessageInput(event) {
//   messageText.value = event.target.innerText;
// }

// // 메시지 지우기
// function clearMessage() {
//   messageText.value = '';
//   clearMessageEditor();
// }

// function clearMessageEditor() {
//   if (messageEditor.value) {
//     messageEditor.value.innerText = '';
//     messageText.value = '';
//   }
// }

// 컴포넌트 언마운트 시 정리
onUnmounted(() => {
  disconnect();
});
</script>
