# dysapp API 및 모델 명세서

## 날짜
2025-12-16

## 📌 1. 사용된 AI 모델

### 1.1 Vision 모델 (디자인 이미지 분석)

**모델명**: `gemini-3-pro-preview`

**용도**: 디자인 이미지 분석 및 3-Layer 평가

**SDK**: `@google/generative-ai` (GoogleGenerativeAI)

**설정**:
```typescript
{
  temperature: 0.2,        // 낮은 온도 = 일관성
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
  responseMimeType: "application/json",
  responseSchema: DESIGN_ANALYSIS_SCHEMA,
  systemInstruction: VISION_SYSTEM_INSTRUCTION
}
```

**입력**:
- 이미지 데이터 (base64 인코딩)
- MIME 타입 (image/jpeg, image/png, image/webp, image/gif)

**출력**:
- JSON 형식의 구조화된 분석 결과 (snake_case)
- 3-Layer 평가 메트릭
- 색상 팔레트, 키워드, 개선 제안

**사용 위치**: `functions/src/analysis/analyzeDesign.ts`

---

### 1.2 Chat 모델 (AI 멘토링)

**모델명**: `gemini-3-pro-preview`

**용도**: 분석 결과 기반 AI 멘토링 챗봇

**SDK**: `@google/generative-ai` (GoogleGenerativeAI)

**설정**:
```typescript
{
  temperature: 0.7,        // 높은 온도 = 자연스러운 대화
  topP: 0.9,
  maxOutputTokens: 2048
}
```

**입력**:
- 분석 컨텍스트 (AnalysisDocument)
- 사용자 메시지
- 대화 히스토리 (선택사항)

**출력**:
- 자연어 응답 (한국어 존댓말)

**특징**:
- FixScope 기반 동적 System Instruction 생성
- 대화 세션 유지 (startChat 사용)
- 분석 결과를 컨텍스트로 활용

**사용 위치**: `functions/src/chat/chatWithMentor.ts`

---

### 1.3 Embedding 모델 (벡터 검색)

**모델명**: `multimodalembedding@001`

**용도**: 이미지 벡터 임베딩 생성

**SDK**: `@google-cloud/vertexai` (VertexAI)

**차원**: 512

**리전**: `us-central1` (필수)

**입력**:
- 이미지 데이터 (base64 인코딩)
- MIME 타입

**출력**:
- `float[512]` 벡터

**사용 위치**: `functions/src/analysis/embedding.ts`

**용도**: Firestore Vector Search를 위한 이미지 임베딩 생성

---

## 📋 2. Cloud Functions API 명세

### 기본 정보

- **Base URL**: `https://asia-northeast3-dysapp1210.cloudfunctions.net`
- **인증**: Firebase Authentication (익명 인증)
- **프로토콜**: HTTPS
- **데이터 형식**: JSON
- **리전**: `asia-northeast3` (서울)

---

### 2.1 analyzeDesign

**엔드포인트**: `analyzeDesign`

**타임아웃**: 300초

**메모리**: 512MB

**용도**: 디자인 이미지 분석 및 3-Layer 평가

**요청 스키마**:
```typescript
{
  imageData: string;      // base64 인코딩된 이미지 데이터
  mimeType: string;       // "image/jpeg" | "image/png" | "image/webp" | "image/gif"
  fileName: string;        // 파일명 (필수)
  userPrompt?: string;     // 사용자 프롬프트 (선택사항)
}
```

**응답 스키마**:
```typescript
{
  success: boolean;
  analysisId: string;
  imageUrl: string;        // Storage public URL
  formatPrediction: "UX_UI" | "Editorial" | "Poster" | "Thumbnail" | "Card" | "BI_CI" | "Unknown";
  overallScore: number;    // 0-100
  fixScope: "StructureRebuild" | "DetailTuning";
  layer1Metrics: {
    hierarchyScore: number;        // 0-100
    scanabilityScore: number;      // 0-100
    goalClarityScore: number;       // 0-100
    accessibility: {
      lowContrast: boolean;
      tinyText: boolean;
      cluttered: boolean;
    };
    diagnosisSummary: string;       // 한국어
  };
  layer2Metrics: {
    gridConsistency: number;        // 0-100
    visualBalance: number;          // 0-100
    colorHarmony: number;            // 0-100
    typographyQuality: number;       // 0-100
  };
  layer3Metrics: {
    trustVibe: "High" | "Medium" | "Low";
    engagementPotential: "High" | "Medium" | "Low";
    emotionalTone: "Calm" | "Energetic" | "Serious" | "Playful" | "Minimal";
  };
  colorPalette: Array<{
    hex: string;                    // 예: "#FF5733"
    approxName: string;             // 예: "Coral Red"
    usageRatio: number;              // 0.0-1.0
  }>;
  detectedKeywords: string[];       // 최대 20개
  nextActions: string[];            // 최대 5개, 한국어
}
```

**프로세스**:
1. 인증 확인
2. Rate limiting 확인
3. 이미지 검증 (크기, 형식)
4. Firebase Storage에 업로드
5. Gemini Vision API로 분석 (`gemini-3-pro-preview`)
6. 이미지 임베딩 생성 (`multimodalembedding@001`)
7. Firestore에 AnalysisDocument 저장
8. 분석 결과 반환

**에러 코드**:
- `unauthenticated`: 인증되지 않음
- `invalid-argument`: 필수 필드 누락 또는 잘못된 형식
- `resource-exhausted`: Rate limit 초과
- `internal`: 내부 서버 오류

---

### 2.2 chatWithMentor

**엔드포인트**: `chatWithMentor`

**타임아웃**: 120초

**메모리**: 256MB

**용도**: 분석 결과 기반 AI 멘토링

**요청 스키마**:
```typescript
{
  analysisId: string;     // 분석 ID (필수)
  message: string;         // 사용자 메시지 (필수)
  sessionId?: string;      // 세션 ID (선택사항, 새 세션 생성 시 생략)
}
```

**응답 스키마**:
```typescript
{
  success: boolean;
  sessionId: string;      // 세션 ID (새로 생성되거나 기존 세션)
  response: string;        // AI 멘토 응답 (한국어)
}
```

**프로세스**:
1. 인증 확인
2. Rate limiting 확인
3. AnalysisDocument 로드
4. 소유권 확인
5. 대화 세션 로드/생성
6. FixScope 기반 System Instruction 생성
7. Gemini Chat API로 응답 생성 (`gemini-3-pro-preview`)
8. 대화 기록 저장
9. 응답 반환

**특징**:
- FixScope에 따라 응답 스타일 변경
  - `StructureRebuild`: 구조 재설계 우선 조언
  - `DetailTuning`: 디테일 튜닝 조언
- 대화 히스토리 유지 (최대 50개 메시지)
- 한국어 존댓말 응답

**에러 코드**:
- `unauthenticated`: 인증되지 않음
- `invalid-argument`: 필수 필드 누락
- `not-found`: 분석을 찾을 수 없음
- `permission-denied`: 소유권 없음
- `resource-exhausted`: Rate limit 초과

---

### 2.3 searchSimilar

**엔드포인트**: `searchSimilar`

**타임아웃**: 60초

**메모리**: 256MB

**용도**: 유사 디자인 벡터 검색

**요청 스키마**:
```typescript
{
  analysisId: string;              // 분석 ID (필수)
  limit?: number;                  // 결과 개수 (기본값: 10, 최대: 20)
  filterFormat?: FormatPrediction; // 포맷 필터 (선택사항)
  filterFixScope?: FixScope;       // fixScope 필터 (선택사항)
  minScore?: number;               // 최소 점수 필터 (선택사항)
}
```

**응답 스키마**:
```typescript
{
  success: boolean;
  results: Array<{
    id: string;                    // 분석 ID
    distance: number;               // Cosine distance (0-1, 낮을수록 유사)
    formatPrediction: FormatPrediction;
    overallScore: number;
    fixScope: FixScope;
    imageUrl: string;
    fileName: string;
  }>;
  count: number;                   // 결과 개수
}
```

**프로세스**:
1. 인증 확인
2. Rate limiting 확인
3. AnalysisDocument 로드
4. 이미지 임베딩 확인
5. Firestore Vector Search 수행 (findNearest)
6. 필터 적용 (포맷, fixScope, minScore)
7. 자기 자신 제외
8. 결과 반환

**에러 코드**:
- `unauthenticated`: 인증되지 않음
- `invalid-argument`: 잘못된 analysisId
- `not-found`: 분석을 찾을 수 없음
- `failed-precondition`: 임베딩이 없음
- `resource-exhausted`: Rate limit 초과

---

### 2.4 getAnalyses

**엔드포인트**: `getAnalyses`

**타임아웃**: 60초

**메모리**: 256MB

**용도**: 사용자 분석 목록 조회

**요청 스키마**:
```typescript
{
  limit?: number;                  // 결과 개수 (기본값: 20)
  offset?: number;                 // 오프셋 (기본값: 0)
  filterFormat?: FormatPrediction; // 포맷 필터 (선택사항)
  filterFixScope?: FixScope;       // fixScope 필터 (선택사항)
}
```

**응답 스키마**:
```typescript
{
  success: boolean;
  analyses: Array<{
    id: string;
    fileName: string;
    imageUrl: string;
    formatPrediction: FormatPrediction;
    overallScore: number;
    fixScope: FixScope;
    createdAt: Timestamp;
  }>;
  total: number;                   // 전체 개수
  hasMore: boolean;                // 더 있는지 여부
}
```

**프로세스**:
1. 인증 확인
2. 사용자 ID 추출 (인증된 사용자)
3. Firestore 쿼리 (userId 필터)
4. 필터 적용 (포맷, fixScope)
5. 정렬 (createdAt 내림차순)
6. 페이지네이션 적용
7. 결과 반환

---

### 2.5 getAnalysis

**엔드포인트**: `getAnalysis`

**타임아웃**: 60초

**메모리**: 256MB

**용도**: 단일 분석 결과 조회

**요청 스키마**:
```typescript
{
  analysisId: string;              // 분석 ID (필수)
}
```

**응답 스키마**:
```typescript
{
  success: boolean;
  analysis: AnalysisDocument;      // 전체 AnalysisDocument
}
```

**프로세스**:
1. 인증 확인
2. AnalysisDocument 로드
3. 소유권 확인
4. 결과 반환

**에러 코드**:
- `unauthenticated`: 인증되지 않음
- `invalid-argument`: 잘못된 analysisId
- `not-found`: 분석을 찾을 수 없음
- `permission-denied`: 소유권 없음

---

### 2.6 getUserProfile

**엔드포인트**: `getUserProfile`

**타임아웃**: 60초

**메모리**: 256MB

**용도**: 사용자 프로필 조회

**요청 스키마**:
```typescript
{
  // 요청 본문 없음 (인증된 사용자 ID 사용)
}
```

**응답 스키마**:
```typescript
{
  success: boolean;
  profile: UserDocument | null;   // 사용자 프로필 또는 null
}
```

**프로세스**:
1. 인증 확인
2. 사용자 ID 추출
3. Firestore에서 UserDocument 조회
4. 결과 반환 (없으면 null)

---

### 2.7 updateUserProfile

**엔드포인트**: `updateUserProfile`

**타임아웃**: 60초

**메모리**: 256MB

**용도**: 사용자 프로필 업데이트

**요청 스키마**:
```typescript
{
  displayName?: string;
  photoURL?: string;
  preferences?: {
    // 사용자 선호도 설정
  };
}
```

**응답 스키마**:
```typescript
{
  success: boolean;
  profile: UserDocument;           // 업데이트된 프로필
}
```

---

### 2.8 deleteAnalysis

**엔드포인트**: `deleteAnalysis`

**타임아웃**: 60초

**메모리**: 256MB

**용도**: 분석 삭제

**요청 스키마**:
```typescript
{
  analysisId: string;              // 분석 ID (필수)
}
```

**응답 스키마**:
```typescript
{
  success: boolean;
  message: string;                  // 삭제 완료 메시지
}
```

**프로세스**:
1. 인증 확인
2. AnalysisDocument 로드
3. 소유권 확인
4. Firestore에서 삭제
5. Storage 파일 삭제 (선택사항)

---

### 2.9 healthCheck

**엔드포인트**: `healthCheck`

**타임아웃**: 10초

**메모리**: 128MB

**용도**: 서비스 헬스 체크

**요청 스키마**:
```typescript
{
  // 요청 본문 없음
}
```

**응답 스키마**:
```typescript
{
  status: "ok";
  timestamp: string;                // ISO 8601 형식
  version: "1.0.0";
  region: "asia-northeast3";
}
```

---

## 🔧 3. API 호출 예시

### 3.1 analyzeDesign 호출

```javascript
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getApp } from 'firebase/app';

const app = getApp();
const functions = getFunctions(app, 'asia-northeast3');
const analyzeDesign = httpsCallable(functions, 'analyzeDesign', { 
  timeout: 300000 
});

// 이미지를 base64로 변환
const file = document.getElementById('fileInput').files[0];
const reader = new FileReader();
reader.onload = async (e) => {
  const base64Data = e.target.result.split(',')[1];
  
  try {
    const result = await analyzeDesign({
      imageData: base64Data,
      mimeType: file.type,
      fileName: file.name,
      userPrompt: '이 디자인의 개선점을 알려주세요'
    });
    
    console.log('분석 결과:', result.data);
  } catch (error) {
    console.error('에러:', error);
  }
};
reader.readAsDataURL(file);
```

### 3.2 chatWithMentor 호출

```javascript
const chatWithMentor = httpsCallable(functions, 'chatWithMentor', {
  timeout: 120000
});

try {
  const result = await chatWithMentor({
    analysisId: 'analysis123',
    message: '색상 팔레트를 어떻게 개선할 수 있나요?',
    sessionId: 'session456'  // 선택사항
  });
  
  console.log('응답:', result.data.response);
  console.log('세션 ID:', result.data.sessionId);
} catch (error) {
  console.error('에러:', error);
}
```

### 3.3 searchSimilar 호출

```javascript
const searchSimilar = httpsCallable(functions, 'searchSimilar', {
  timeout: 60000
});

try {
  const result = await searchSimilar({
    analysisId: 'analysis123',
    limit: 10,
    filterFormat: 'UX_UI',
    filterFixScope: 'DetailTuning',
    minScore: 70
  });
  
  console.log('유사 디자인:', result.data.results);
  console.log('개수:', result.data.count);
} catch (error) {
  console.error('에러:', error);
}
```

---

## ⚠️ 4. 에러 처리

### 4.1 에러 코드

| 코드 | 설명 | HTTP 상태 |
|------|------|-----------|
| `unauthenticated` | 인증되지 않음 | 401 |
| `permission-denied` | 권한 없음 | 403 |
| `not-found` | 리소스를 찾을 수 없음 | 404 |
| `invalid-argument` | 잘못된 인자 | 400 |
| `failed-precondition` | 전제 조건 실패 | 412 |
| `resource-exhausted` | 리소스 할당량 초과 | 429 |
| `internal` | 내부 서버 오류 | 500 |

### 4.2 에러 응답 형식

```typescript
{
  code: string;        // 에러 코드
  message: string;     // 에러 메시지
  details?: any;       // 상세 정보 (선택사항)
}
```

---

## 📊 5. 제한 사항

### 5.1 Rate Limiting

- `analyzeDesign`: 사용자당 시간당 제한
- `chatWithMentor`: 사용자당 시간당 제한
- `searchSimilar`: 사용자당 시간당 제한

### 5.2 파일 크기 제한

- 이미지 최대 크기: 10MB
- 지원 형식: JPEG, PNG, WebP, GIF

### 5.3 응답 크기 제한

- 색상 팔레트: 최대 5개
- 키워드: 최대 20개
- 개선 제안: 최대 5개
- 대화 히스토리: 최대 50개 메시지

---

## 📝 6. 참고 문서

- **API 명세**: `docs/dysapp_APISPEC.md`
- **기능 요구사항**: `docs/dysapp_PRD.md`
- **기술 명세**: `docs/dysapp_TSD.md`
- **프로젝트 개요**: `docs/dysapp_SRD.md`

---

## 🔄 7. 변경 이력

| 날짜 | 변경 사항 |
|------|----------|
| 2025-12-16 | 모델 업데이트: gemini-2.0-flash → gemini-3-pro-preview |
| 2025-12-16 | Chat 모델 업데이트: gemini-2.5-flash → gemini-3-pro-preview |

---

*Generated for dysapp project (Firebase Project ID: dysapp1210)*


