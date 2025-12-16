# Gemini 모델명 검증 보고서

## 날짜
2025-12-16

## 웹 검색 결과 요약

### 1. Vision 모델: `gemini-3-pro-preview`
- ✅ **확인됨**: 실제로 존재하는 모델
- **출처**: Google AI 공식 문서
- **특징**: 
  - Gemini 3.0 Pro Preview 버전
  - 멀티모달 이해 및 구조화된 출력 지원
  - 입력 최대 1,048,576 토큰, 출력 최대 65,536 토큰

### 2. Chat 모델: `gemini-2.5-flash`
- ❌ **확인 안됨**: 공식 문서에서 확인되지 않음
- **문제**: 실제 Google Gemini API에서 사용 가능한 모델명이 아님
- **대안**: 
  - `gemini-1.5-flash` (안정 버전)
  - `gemini-2.0-flash-exp` (실험 버전)
  - `gemini-3-pro-preview` (3.0 이상, 확인됨)

## 최종 결정

사용자 요구사항: **"3.0 이상"**

### 업데이트된 모델명

1. **Vision 모델**: `gemini-3-pro-preview` ✅
   - 문서 스펙과 일치
   - 실제 존재하는 모델
   - 3.0 이상 요구사항 충족

2. **Chat 모델**: `gemini-3-pro-preview` ✅
   - 원래 문서의 `gemini-2.5-flash`는 존재하지 않음
   - 3.0 이상 요구사항 충족
   - Vision과 동일한 모델 사용 (프로덕션에서도 안정적)

## 변경 사항

### `functions/src/constants.ts`
```typescript
// 이전
export const VISION_MODEL = "gemini-3-pro-preview";
export const CHAT_MODEL = "gemini-2.5-flash";  // ❌ 존재하지 않음

// 현재
export const VISION_MODEL = "gemini-3-pro-preview";  // ✅
export const CHAT_MODEL = "gemini-3-pro-preview";     // ✅ 3.0 이상
```

## 검증 결과

- ✅ TypeScript 빌드 성공
- ✅ Vision 모델: 실제 존재하는 모델명
- ✅ Chat 모델: 3.0 이상 요구사항 충족
- ⚠️ 문서 스펙(`gemini-2.5-flash`)과 불일치하지만, 실제 사용 가능한 모델로 수정

## 참고사항

1. **문서 스펙 불일치**: 
   - `docs/dysapp_PRD.md`와 `docs/dysapp_APISPEC.md`에서 `gemini-2.5-flash`를 언급했지만, 실제 API에서는 사용 불가

2. **모델 선택 이유**:
   - `gemini-3-pro-preview`는 실제로 존재하고 사용 가능한 모델
   - 3.0 이상 요구사항 충족
   - Vision과 Chat 모두 동일한 모델 사용으로 일관성 유지

3. **향후 업데이트**:
   - Google에서 `gemini-3-flash` 같은 Flash 버전이 출시되면 변경 고려
   - 현재는 Pro Preview 버전이 가장 안정적이고 최신 버전

## 다음 단계

1. **배포**: Functions 재배포 필요
2. **테스트**: 실제 API 호출로 모델명 검증
3. **문서 업데이트**: 문서 스펙도 실제 모델명으로 업데이트 권장


