# GCP API 활성화 요구사항

**프로젝트**: dysapp1210  
**작성일**: 2025-01-XX

---

## 📋 필수 API 목록

### 🔴 Critical (필수)

#### Firebase 핵심 서비스
| API 이름 | API ID | 용도 |
|---------|--------|------|
| Cloud Firestore API | `firestore.googleapis.com` | 데이터베이스 (분석 결과 저장) |
| Firebase API | `firebase.googleapis.com` | Firebase 핵심 서비스 |
| Firebase Rules API | `firebaserules.googleapis.com` | 보안 규칙 배포 |
| Firebase Hosting API | `firebasehosting.googleapis.com` | 정적 호스팅 |

#### Cloud Functions
| API 이름 | API ID | 용도 |
|---------|--------|------|
| Cloud Functions API | `cloudfunctions.googleapis.com` | 서버리스 함수 실행 |
| Cloud Build API | `cloudbuild.googleapis.com` | Functions 빌드 및 배포 |

#### Cloud Storage
| API 이름 | API ID | 용도 |
|---------|--------|------|
| Cloud Storage API | `storage-component.googleapis.com` | 파일 저장소 |
| Cloud Storage JSON API | `storage-api.googleapis.com` | Storage API 접근 |

#### AI/ML 서비스
| API 이름 | API ID | 용도 |
|---------|--------|------|
| Generative AI API | `generativelanguage.googleapis.com` | Gemini Vision/Chat 모델 |
| Vertex AI API | `aiplatform.googleapis.com` | multimodalembedding@001 |

#### 인증 및 보안
| API 이름 | API ID | 용도 |
|---------|--------|------|
| Firebase Authentication API | `identitytoolkit.googleapis.com` | 사용자 인증 |
| Firebase Token Service | `securetoken.googleapis.com` | 토큰 발급 |

---

### 🟡 Important (권장)

#### 모니터링 및 로깅
| API 이름 | API ID | 용도 |
|---------|--------|------|
| Cloud Logging API | `logging.googleapis.com` | 로그 수집 및 분석 |
| Cloud Monitoring API | `monitoring.googleapis.com` | 성능 모니터링 |

#### 리소스 관리
| API 이름 | API ID | 용도 |
|---------|--------|------|
| Cloud Resource Manager API | `cloudresourcemanager.googleapis.com` | 프로젝트 관리 |
| Service Usage API | `serviceusage.googleapis.com` | API 활성화 관리 |

---

### 🟢 Optional (선택적)

#### BigQuery (향후 사용 예정)
| API 이름 | API ID | 용도 |
|---------|--------|------|
| BigQuery API | `bigquery.googleapis.com` | 데이터 웨어하우스 |
| BigQuery Connection API | `bigqueryconnection.googleapis.com` | 외부 연결 |

---

## 🚀 일괄 활성화 방법

### 방법 1: PowerShell 스크립트 (Windows)

```powershell
# 실행 권한 부여 (필요시)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# 스크립트 실행
.\enable-gcp-apis.ps1
```

### 방법 2: Bash 스크립트 (Linux/Mac)

```bash
# 실행 권한 부여
chmod +x enable-gcp-apis.sh

# 스크립트 실행
./enable-gcp-apis.sh
```

### 방법 3: 수동 활성화 (GCP Console)

1. [GCP API 라이브러리](https://console.cloud.google.com/apis/library?project=dysapp1210) 접속
2. 각 API 검색 후 활성화

### 방법 4: gcloud CLI (수동)

```bash
# 프로젝트 설정
gcloud config set project dysapp1210

# 필수 API 활성화
gcloud services enable firestore.googleapis.com
gcloud services enable firebase.googleapis.com
gcloud services enable firebaserules.googleapis.com
gcloud services enable firebasehosting.googleapis.com
gcloud services enable cloudfunctions.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable storage-component.googleapis.com
gcloud services enable storage-api.googleapis.com
gcloud services enable generativelanguage.googleapis.com
gcloud services enable aiplatform.googleapis.com
gcloud services enable identitytoolkit.googleapis.com
gcloud services enable securetoken.googleapis.com
gcloud services enable logging.googleapis.com
gcloud services enable monitoring.googleapis.com
gcloud services enable cloudresourcemanager.googleapis.com
gcloud services enable serviceusage.googleapis.com

# 선택적 API (BigQuery)
gcloud services enable bigquery.googleapis.com
gcloud services enable bigqueryconnection.googleapis.com
```

---

## ✅ 활성화 확인

### gcloud CLI로 확인

```bash
# 활성화된 API 목록 확인
gcloud services list --enabled --project=dysapp1210

# 특정 API 확인
gcloud services list --enabled --project=dysapp1210 --filter="name:firestore.googleapis.com"
```

### GCP Console에서 확인

1. [API 및 서비스 → 사용 설정된 API](https://console.cloud.google.com/apis/dashboard?project=dysapp1210)
2. 필수 API가 모두 활성화되어 있는지 확인

---

## 🔍 API별 상세 정보

### Generative AI API (Gemini)
- **용도**: 이미지 분석 (`analyzeDesign`), 채팅 (`chatWithMentor`)
- **모델**: `gemini-2.0-flash`
- **쿼터**: [Gemini API 쿼터](https://ai.google.dev/pricing)
- **비용**: 사용량 기반 과금

### Vertex AI API
- **용도**: 이미지 임베딩 생성 (`generateImageEmbedding`)
- **모델**: `multimodalembedding@001`
- **리전**: `us-central1` (필수)
- **비용**: [Vertex AI 가격](https://cloud.google.com/vertex-ai/pricing)

### Cloud Firestore API
- **용도**: 분석 결과, 채팅 세션, 사용자 프로필 저장
- **리전**: `nam5` (예외)
- **비용**: 읽기/쓰기 작업 기반

### Cloud Functions API
- **용도**: 서버리스 함수 실행
- **리전**: `asia-northeast3` (서울)
- **비용**: 실행 시간 및 메모리 기반

---

## ⚠️ 주의사항

1. **API 활성화 시간**: 일부 API는 활성화에 몇 분 소요될 수 있습니다.
2. **권한 필요**: 프로젝트 소유자 또는 Editor 권한이 필요합니다.
3. **비용**: API 활성화 자체는 무료이지만, 사용 시 비용이 발생할 수 있습니다.
4. **리전 제약**: Vertex AI는 `us-central1`에서만 사용 가능합니다.

---

## 📞 문제 해결

### API 활성화 실패 시

1. **권한 확인**
   ```bash
   gcloud projects get-iam-policy dysapp1210
   ```

2. **수동 활성화**
   - GCP Console에서 직접 활성화 시도
   - 오류 메시지 확인

3. **지원 요청**
   - [GCP 지원](https://cloud.google.com/support)에 문의

### 일반적인 오류

- **403 Forbidden**: 프로젝트 권한 부족
- **404 Not Found**: 프로젝트 ID 확인 필요
- **429 Too Many Requests**: 잠시 후 재시도

---

## 📚 참고 자료

- [GCP API 라이브러리](https://console.cloud.google.com/apis/library)
- [Firebase 문서](https://firebase.google.com/docs)
- [Gemini API 문서](https://ai.google.dev/docs)
- [Vertex AI 문서](https://cloud.google.com/vertex-ai/docs)


