# dysapp 프론트엔드-백엔드 통합 가이드

> **작성일**: 2025-01-27  
> **프로젝트**: dysapp (Firebase Project ID: dysapp1210)  
> **참조 문서**: `docs/dysapp/dysapp_TSD.md`, `docs/dysapp/dysapp_FRD.md`, `docs/dysapp/dysapp_APISPEC.md`

---

## 📋 목차

1. [파일 구조](#1-파일-구조)
2. [index.html 통합](#2-indexhtml-통합)
3. [analyze.html 통합](#3-analyzehtml-통합)
4. [searchTab.html 통합](#4-searchtabhtml-통합)
5. [에러 처리](#5-에러-처리)

---

## 1. 파일 구조

### 1.1 생성된 파일

다음 파일들이 `js/api/` 및 `js/utils/` 폴더에 생성되었습니다:

```
js/
├── api/
│   ├── firebaseConfig.js   # Firebase 설정
│   ├── firebaseService.js  # Firebase SDK 초기화
│   └── apiService.js       # API 호출 함수들
└── utils/
    ├── dataAdapter.js      # 데이터 변환 어댑터
    ├── errorHandler.js     # 전역 에러 핸들러
    └── fileUtils.js        # 파일 유틸리티
```

### 1.2 사용 방법

각 HTML 파일에서 다음과 같이 import하여 사용:

```html
<script type="module">
  import { callAnalyzeDesign } from './js/api/apiService.js';
  import { adaptAnalysisResult } from './js/utils/dataAdapter.js';
  import { handleError } from './js/utils/errorHandler.js';
  import { fileToBase64, validateFile } from './js/utils/fileUtils.js';
</script>
```

---

## 2. index.html 통합

### 2.1 파일 업로드 처리

`index.html`의 파일 업로드 기능에 다음 코드를 추가:

```html
<script type="module">
  import { callAnalyzeDesign } from './js/api/apiService.js';
  import { fileToBase64, validateFile } from './js/utils/fileUtils.js';
  import { handleError } from './js/utils/errorHandler.js';

  document.addEventListener('DOMContentLoaded', () => {
    const uploadInput = document.querySelector('.upload_input');
    const uploadBox = document.querySelector('.uploadBox');

    // 파일 선택 이벤트
    uploadInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      // 파일 검증
      const validation = validateFile(file);
      if (!validation.valid) {
        alert(validation.error);
        return;
      }

      try {
        // 로딩 상태 표시
        uploadBox.style.opacity = '0.5';
        uploadBox.style.pointerEvents = 'none';

        // base64 변환
        const imageData = await fileToBase64(file);

        // API 호출
        const result = await callAnalyzeDesign(
          imageData,
          file.type,
          file.name
        );

        if (result.success) {
          // localStorage에 저장
          localStorage.setItem('lastAnalysisId', result.analysisId);
          
          // analyze.html로 리다이렉트
          window.location.href = `analyze.html?analysisId=${result.analysisId}`;
        }
      } catch (error) {
        handleError(error);
      } finally {
        uploadBox.style.opacity = '1';
        uploadBox.style.pointerEvents = 'auto';
      }
    });

    // 드래그 앤 드롭 처리
    uploadBox.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadBox.style.borderColor = '#007bff';
    });

    uploadBox.addEventListener('dragleave', () => {
      uploadBox.style.borderColor = '';
    });

    uploadBox.addEventListener('drop', async (e) => {
      e.preventDefault();
      uploadBox.style.borderColor = '';

      const file = e.dataTransfer.files[0];
      if (!file) return;

      // 파일 검증 및 업로드 (위와 동일)
      uploadInput.files = e.dataTransfer.files;
      uploadInput.dispatchEvent(new Event('change'));
    });
  });
</script>
```

---

## 3. analyze.html 통합

### 3.1 분석 결과 로드

`analyze.html`에 다음 코드를 추가하여 분석 결과를 표시:

```html
<script type="module">
  import { callGetAnalysis } from './js/api/apiService.js';
  import { adaptAnalysisResult } from './js/utils/dataAdapter.js';
  import { handleError } from './js/utils/errorHandler.js';

  document.addEventListener('DOMContentLoaded', async () => {
    // analysisId 가져오기
    const urlParams = new URLSearchParams(window.location.search);
    const analysisId = urlParams.get('analysisId') || 
                      localStorage.getItem('lastAnalysisId');

    if (!analysisId) {
      alert('분석 ID가 없습니다.');
      window.location.href = 'index.html';
      return;
    }

    try {
      // API 호출
      const result = await callGetAnalysis(analysisId);
      
      if (!result.success || !result.analysis) {
        throw new Error('분석 결과를 불러올 수 없습니다.');
      }

      // 데이터 변환
      const adaptedData = adaptAnalysisResult(result.analysis);
      
      // 화면 렌더링
      renderAnalysisResult(adaptedData);
    } catch (error) {
      handleError(error);
    }
  });

  function renderAnalysisResult(data) {
    // H1 텍스트 업데이트
    const h1Text = document.querySelector('.H1Text');
    if (h1Text) {
      h1Text.textContent = data.layer1.diagnosisSummary || '분석 결과';
    }

    // 색상 팔레트 표시
    renderColorPalette(data.colorPalette);

    // 키워드 표시
    renderKeywords(data.detectedKeywords);

    // 활용 제안 표시
    renderNextActions(data.nextActions);

    // Layer 메트릭 표시 (필요시)
    // renderLayerMetrics(data);
  }

  function renderColorPalette(colorPalette) {
    const colorElement = document.querySelector('.dataElement');
    if (!colorElement || !colorPalette.length) return;

    // 첫 번째 색상
    const color1 = document.querySelector('.color1');
    if (color1 && colorPalette[0]) {
      color1.textContent = colorPalette[0].hex;
      color1.style.backgroundColor = colorPalette[0].hex;
    }

    // 나머지 색상들
    const colorLayout = document.querySelector('.colorlayout');
    if (colorLayout) {
      colorLayout.innerHTML = '';
      colorPalette.slice(1, 4).forEach(color => {
        const span = document.createElement('span');
        span.className = `color${colorLayout.children.length + 2}`;
        span.textContent = color.hex;
        span.style.backgroundColor = color.hex;
        colorLayout.appendChild(span);
      });
    }
  }

  function renderKeywords(keywords) {
    const eleTextContainer = document.querySelector('.dataElement');
    if (!eleTextContainer || !keywords.length) return;

    const eleTexts = eleTextContainer.querySelectorAll('.eleText');
    keywords.slice(0, eleTexts.length).forEach((keyword, index) => {
      if (eleTexts[index]) {
        eleTexts[index].textContent = keyword;
      }
    });
  }

  function renderNextActions(actions) {
    const utilizeBox = document.querySelector('.utilizeBox');
    if (!utilizeBox || !actions.length) return;

    utilizeBox.innerHTML = '';
    actions.forEach(action => {
      const li = document.createElement('li');
      li.className = 'utilize';
      li.textContent = action;
      utilizeBox.appendChild(li);
    });
  }
</script>
```

---

## 4. searchTab.html 통합

### 4.1 검색 기능 통합

`searchTab.html`에 다음 코드를 추가:

```html
<script type="module">
  import { callSearchImages, callSearchSimilar } from './js/api/apiService.js';
  import { handleError } from './js/utils/errorHandler.js';

  document.addEventListener('DOMContentLoaded', () => {
    const searchTextarea = document.querySelector('.search');
    const searchIcon = document.querySelector('.searchIcon');
    const uploadIcon = document.querySelector('.uploadIcon');
    const searchImgBox = document.querySelector('.searchImgBox');

    // 텍스트 검색
    searchIcon?.addEventListener('click', async () => {
      const query = searchTextarea?.value.trim();
      if (!query) return;

      try {
        const result = await callSearchImages(query, 12);
        if (result.success && result.results) {
          renderSearchResults(result.results);
        }
      } catch (error) {
        handleError(error);
      }
    });

    // 이미지 업로드 검색 (유사 디자인 검색)
    uploadIcon?.addEventListener('click', () => {
      // 파일 선택 다이얼로그 열기
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/png, image/jpeg';
      input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // 먼저 이미지를 분석한 후 유사 디자인 검색
        // (간단한 구현을 위해 analyzeDesign 호출 후 searchSimilar 호출)
        // 실제 구현은 analyzeDesign 완료 후 자동으로 searchSimilar 호출하는 것이 좋음
      };
      input.click();
    });
  });

  function renderSearchResults(results) {
    const searchImgBox = document.querySelector('.searchImgBox');
    if (!searchImgBox) return;

    // 기존 이미지 제거
    searchImgBox.innerHTML = '';

    // 검색 결과 표시
    results.forEach((result, index) => {
      const img = document.createElement('img');
      img.src = result.imageUrl || result.link;
      img.className = 'searchImg';
      img.alt = result.title || `검색 결과 ${index + 1}`;
      img.onclick = () => {
        // 이미지 클릭 시 상세 페이지로 이동
        window.open(result.link, '_blank');
      };
      searchImgBox.appendChild(img);
    });
  }
</script>
```

---

## 5. 에러 처리

모든 API 호출에서 에러 처리는 `handleError` 함수를 사용:

```javascript
import { handleError } from './js/utils/errorHandler.js';

try {
  const result = await callAnalyzeDesign(imageData, mimeType, fileName);
  // 성공 처리
} catch (error) {
  handleError(error); // 자동으로 에러 메시지 표시 및 처리
}
```

---

## 참조 문서

- **기술 명세**: `docs/dysapp/dysapp_TSD.md`
- **기능 요구사항**: `docs/dysapp/dysapp_FRD.md`
- **API 명세**: `docs/dysapp/dysapp_APISPEC.md`
- **시스템 요구사항**: `docs/dysapp/dysapp_SRD.md`

---

*마지막 업데이트: 2025-01-27*

