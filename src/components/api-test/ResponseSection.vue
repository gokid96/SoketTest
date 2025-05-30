<template>
  <div class="pt-5 px-1 md:min-w-2xl">
    <!-- Header와 Clear 버튼을 함께 배치 -->
    <div class="flex justify-between items-center mb-2 px-2">
      <h2 class="text-xl flex items-center">
        Response
      </h2>

      <button @click="clearMessages" :disabled="messages.length <= 0" class="ml-auto border px-8 py-2 border-gray-600 bg-gray-50 text-sm text-gray-700 hover:bg-gray-100
                  dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-300 dark:hover:bg-white/[0.05]
                  disabled:opacity-50 disabled:cursor-not-allowed">
        Clear
      </button>
    </div>

    <section class="mb-4 px-2 dark:border-gray-800">
      <!-- WebSocket 메시지 표시 -->
      <div v-if="messages && messages.length > 0" class="mb-4">
        <div
          class="border border-gray-600 dark:border-gray-800 px-3  min-h-45  max-h-45 min-w-[200px] overflow-auto bg-gray-50 dark:bg-white/[0.03]">
          <div v-for="(message, index) in messages" :key="index" class="border-b border-gray-600 px-1.5 py-2.5 text-sm">

            <!-- 메시지 헤더 (클릭 가능) -->
            <div class="flex justify-between cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded p-1"
              @click="toggleDetails(index)">
              <div class="flex items-center">
                <!-- <span class="mr-2" :class="getMessageTypeClass(message.type)">
                  {{ getMessageTypeIcon(message.type) }}
                </span> -->

                <component :is="getMessageTypeIcon(message.type)" :size="13" :class="getMessageTypeClass(message.type)"
                  class="mr-2" />

                <span class="ml-1">{{ getMessagePreview(message.content) }}</span>

              </div>
              <div class="flex">
                <span class="whitespace-nowrap text-xs text-gray-500">
                  [{{ message.timestamp }}]
                </span>
                <!-- 펼치기/접기 아이콘 -->
                <span class="ml-2 text-xs text-gray-400">
                  {{ expandedMessages.has(index) ? '▼' : '▶' }}
                </span>
              </div>
            </div>

            <!-- 상세 정보 (펼쳐졌을 때만 표시) -->
            <div v-if="expandedMessages.has(index)"
              class="mt-3 pl-4 border-l-2 border-gray-300 dark:border-gray-600 transition-all duration-200">

              <!-- 메시지 내용 -->
              <div class="mb-2">

                <pre
                  class=" mt-1 text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-x-auto ">{{ message.content }}</pre>
              </div>

              <!-- 메시지 메타데이터 -->
              <div class="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span class="font-semibold text-gray-600 dark:text-gray-400">Type:</span>
                  <span class="ml-1" :class="getMessageTypeClass(message.type)">
                    {{ message.type }}
                  </span>
                </div>
                <div v-if="message.protocol">
                  <span class="font-semibold text-gray-600 dark:text-gray-400">Protocol:</span>
                  <span class="ml-1">{{ message.protocol }}</span>
                </div>
                <div v-if="message.destination">
                  <span class="font-semibold text-gray-600 dark:text-gray-400">Destination:</span>
                  <span class="ml-1 font-mono text-xs">{{ message.destination }}</span>
                </div>
                <div>
                  <span class="font-semibold text-gray-600 dark:text-gray-400">Time:</span>
                  <span class="ml-1">{{ message.timestamp }}</span>
                </div>
              </div>

              <!-- JSON 형태 메시지인 경우 파싱해서 표시 -->
              <div v-if="getParsedJson(message.content)" class="mt-2">
                <span class="text-xs font-semibold text-gray-600 dark:text-gray-400">Parsed JSON:</span>
                <pre
                  class="mt-1 text-xs bg-green-50 dark:bg-green-900/20 p-2 rounded overflow-x-auto">{{ getParsedJson(message.content) }}</pre>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 기존 Response 표시 -->
      <div v-if="response" class="response-content">
        <h3 class="text-md mb-2">Response:</h3>
        <pre class="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
          {{ formattedResponse }}
        </pre>
      </div>

      <div v-else-if="(!messages || messages.length === 0)"
        class="text-sm border border-gray-600 min-h-45  max-h-45 min-w-[200px] flex items-start justify-center text-gray-500">
        <span class="my-auto">Establish a connection to send and receive messages.</span>
      </div>

    </section>

  </div>

</template>

<script setup>
import { computed, ref } from 'vue';
import {
  MoveUp,         // 송신
  MoveDown,       // 수신
  AlertCircle,     // 시스템/기본
  Unplug
} from 'lucide-vue-next';
const props = defineProps({
  response: {
    type: Object,
    default: null
  },
  messages: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['clear-messages']);
//메세지 클리어
function clearMessages() {
  expandedMessages.value.clear();
  emit('clear-messages');
}

// 펼쳐진 메시지들을 추적하는 Set
const expandedMessages = ref(new Set());

// 메시지 상세 정보 토글
function toggleDetails(index) {
  if (expandedMessages.value.has(index)) {
    expandedMessages.value.delete(index);
  } else {
    expandedMessages.value.add(index);
  }
  // Vue의 반응성을 위해 새 Set 객체 생성
  expandedMessages.value = new Set(expandedMessages.value);
}

// 메시지 미리보기 (긴 메시지는 잘라서 표시)
function getMessagePreview(content) {
  if (!content) return '';
  const maxLength = 50;
  return content.length > maxLength
    ? content.substring(0, maxLength)
    : content;
}

// JSON 파싱 시도
function getParsedJson(content) {
  try {
    const parsed = JSON.parse(content);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return null;
  }
}

const formattedResponse = computed(() => {
  if (!props.response) return '';
  try {
    return JSON.stringify(props.response, null, 2);
  } catch {
    return String(props.response);
  }
});


function getMessageTypeClass(type) {
  switch (type) {
    case 'sent': return 'text-blue-600';
    case 'received': return 'text-green-600';
    case 'system': return 'text-orange-600';
    case 'connected': return 'text-green-600';    // ✅ 연결 시 초록색
    case 'disconnected': return 'text-red-600';   // ✅ 연결 해제 시 빨간색
    default: return 'text-gray-600';
  }
}
function getMessageTypeIcon(type) {
  switch (type) {
    case 'sent': return MoveUp;
    case 'received': return MoveDown;
    case 'connected': return Unplug;     // ✅ 연결 아이콘
    case 'disconnected': return Unplug;  // ✅ 연결 해제 아이콘
    default: return AlertCircle;
  }
}
</script>

<style lang="scss" scoped></style>
