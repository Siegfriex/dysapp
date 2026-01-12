# Gemini 모델 업데이트 보고서

## 날짜
2025-12-16

## 변경 사항 요약

### 모델 버전 업데이트

문서 스펙(`docs/dysapp_PRD.md`, `docs/dysapp_APISPEC.md`)에 따라 모델 버전을 업데이트했습니다.

#### 1. Vision 모델 업데이트
- **이전**: `gemini-2.0-flash`
- **현재**: `gemini-3-pro-preview`
- **파일**: `functions/src/constants.ts`
- **사용 위치**: `functions/src/analysis/analyzeDesign.ts`
- **용도**: 디자인 이미지 분석 및 3-Layer 평가

#### 2. Chat 모델 업데이트
- **이전**: `gemini-2.0-flash`
- **현재**: `gemini-2.5-flash`
- **파일**: `functions/src/constants.ts`
- **사용 위치**: `functions/src/chat/chatWithMentor.ts`
- **용도**: AI 멘토링 챗봇

#### 3. Embedding 모델 (변경 없음)
- **모델**: `multimodalembedding@001`
- **파일**: `functions/src/constants.ts`
- **사용 위치**: `functions/src/analysis/embedding.ts`
- **용도**: 이미지 벡터 임베딩 생성 (512차원)

## 문서 스펙 참조

### `docs/dysapp_PRD.md`
- **FR-001 (analyzeDesign)**: 모델 `gemini-3-pro-preview` (568줄)
- **FR-002 (chatWithMentor)**: 모델 `gemini-2.5-flash` (589줄)
- **Section 15.2**: 
  - `VISION_MODEL = "gemini-3-pro-preview"`
  - `CHAT_MODEL = "gemini-2.5-flash"`

### `docs/dysapp_APISPEC.md`
- **2.1 Vision API**: 모델 `gemini-3-pro-preview` (342줄)
- **2.2 Chat API**: 모델 `gemini-2.5-flash` (368줄)

## 변경된 파일

1. `functions/src/constants.ts`
   - `VISION_MODEL`: `"gemini-2.0-flash"` → `"gemini-3-pro-preview"`
   - `CHAT_MODEL`: `"gemini-2.0-flash"` → `"gemini-2.5-flash"`

## 영향받는 함수

### analyzeDesign
- **파일**: `functions/src/analysis/analyzeDesign.ts`
- **변경**: `VISION_MODEL` 상수 사용으로 자동 반영
- **기능**: 이미지 분석 시 `gemini-3-pro-preview` 모델 사용

### chatWithMentor
- **파일**: `functions/src/chat/chatWithMentor.ts`
- **변경**: `CHAT_MODEL` 상수 사용으로 자동 반영
- **기능**: AI 멘토링 챗봇 시 `gemini-2.5-flash` 모델 사용

## 검증 결과

- ✅ TypeScript 빌드 성공
- ✅ Linter 오류 없음
- ✅ 모든 관련 파일에서 상수 참조 확인
- ✅ 문서 스펙과 코드 일치

## 다음 단계

1. **배포**: Functions 재배포 필요
   ```bash
   firebase deploy --only functions:analyzeDesign,functions:chatWithMentor
   ```

2. **테스트**: 
   - 이미지 분석 기능 테스트 (gemini-3-pro-preview)
   - AI 멘토링 챗봇 테스트 (gemini-2.5-flash)

3. **모니터링**: 
   - Cloud Functions 로그 확인
   - API 응답 시간 및 품질 모니터링

## 주의사항

⚠️ **모델 변경으로 인한 영향**:
- `gemini-3-pro-preview`는 preview 버전이므로 API 동작이 변경될 수 있음
- 응답 형식이나 품질이 이전 버전과 다를 수 있음
- 비용 구조가 다를 수 있음 (프로덕션 모델 vs preview)

## 참고

- Gemini 3.0 Pro Preview는 최신 멀티모달 기능을 제공합니다
- Gemini 2.5 Flash는 빠른 응답 속도와 효율적인 비용을 제공합니다
- 문서 스펙: `docs/dysapp_PRD.md` Section 8.1, 15.2



