# dysapp 유저 플로우차트

**작성일**: 2025-01-15  
**프로젝트**: dysapp1210  
**버전**: 1.0.0

---

## 목차

1. [전체 유저 여정](#1-전체-유저-여정)
2. [주요 유저 시나리오](#2-주요-유저-시나리오)
3. [페이지별 유저 플로우](#3-페이지별-유저-플로우)

---

## 1. 전체 유저 여정

### 1.1 첫 사용자 여정 (First-Time User Journey)

```mermaid
flowchart TD
    Start([웹앱 접속]):::startEnd
    InitApp[앱 초기화]:::process
    
    Start ==> InitApp
    
    subgraph 인증["인증 단계"]
        direction TB
        CheckAuth{"인증 상태 확인"}:::decision
        AuthSuccess[인증 완료]:::process
        SignInAnon[익명 인증 시도]:::process
        SignInResult{"인증 성공?"}:::decision
        AuthError[인증 오류]:::error
        
        InitApp ==> CheckAuth
        CheckAuth ==>|인증됨| AuthSuccess
        CheckAuth -->|미인증| SignInAnon
        SignInAnon --> SignInResult
        SignInResult ==>|Yes| AuthSuccess
        SignInResult -.->|No| AuthError
    end
    
    subgraph 업로드["업로드 단계"]
        direction TB
        UploadPage[업로드 페이지 진입]:::process
        FileSelect[파일 선택]:::process
        FileValidate[파일 검증]:::process
        Preview[미리보기 표시]:::process
        OptionalPrompt{"프롬프트 입력?"}:::decision
        WithPrompt[프롬프트 포함]:::process
        NoPrompt[프롬프트 없음]:::process
        SendAnalysis[분석 요청 전송]:::process
        
        AuthSuccess ==> UploadPage
        UploadPage ==> FileSelect
        FileSelect ==> FileValidate
        FileValidate ==>|유효| Preview
        FileValidate -.->|무효| FileSelect
        Preview ==> OptionalPrompt
        OptionalPrompt ==>|있음| WithPrompt
        OptionalPrompt -->|없음| NoPrompt
        WithPrompt --> SendAnalysis
        NoPrompt --> SendAnalysis
    end
    
    subgraph 분석_대기["분석 대기 단계"]
        direction TB
        Loading[로딩 표시]:::process
        AnalysisAPI[analyzeDesign API 호출]:::process
        AnalysisResult{"분석 결과"}:::decision
        AnalysisSuccess[분석 성공]:::process
        AnalysisError[분석 오류]:::error
        RetryDecision{"재시도?"}:::decision
        
        SendAnalysis ==> Loading
        Loading ==> AnalysisAPI
        AnalysisAPI ==> AnalysisResult
        AnalysisResult ==>|성공| AnalysisSuccess
        AnalysisResult -.->|실패| AnalysisError
        AnalysisError --> RetryDecision
        RetryDecision -.->|Yes| SendAnalysis
        RetryDecision -.->|No| UploadPage
    end
    
    subgraph 분석_결과["분석 결과 단계"]
        direction TB
        NavigateAnalyze[분석 페이지로 이동]:::process
        LoadData[분석 데이터 로드]:::process
        RenderResults[결과 렌더링]:::process
        ShowAnalysis[분석 결과 표시]:::process
        
        AnalysisSuccess ==> NavigateAnalyze
        NavigateAnalyze ==> LoadData
        LoadData ==> RenderResults
        RenderResults ==> ShowAnalysis
    end
    
    subgraph 후속_액션["후속 액션"]
        direction TB
        UserChoice{"사용자 선택"}:::decision
        ViewDetails[상세 모달 보기]:::process
        StartChat[AI 멘토와 대화]:::process
        SearchSimilar[유사 디자인 검색]:::process
        SaveItem[항목 저장]:::process
        
        ShowAnalysis ==> UserChoice
        UserChoice ==>|상세 보기| ViewDetails
        UserChoice -->|AI 대화| StartChat
        UserChoice -->|유사 검색| SearchSimilar
        UserChoice -->|저장| SaveItem
    end
    
    End([작업 완료]):::startEnd
    
    ViewDetails --> End
    StartChat --> End
    SearchSimilar --> End
    SaveItem --> End
    
    classDef startEnd fill:#90EE90,stroke:#006400,stroke-width:3px,color:#000
    classDef process fill:#87CEEB,stroke:#4682B4,stroke-width:2px,color:#000
    classDef decision fill:#FFD700,stroke:#FF8C00,stroke-width:2px,color:#000
    classDef error fill:#FF6B6B,stroke:#DC143C,stroke-width:2px,color:#fff
```

### 1.2 재방문 사용자 여정 (Returning User Journey)

```mermaid
flowchart TD
    Start([웹앱 접속]):::startEnd
    InitApp[앱 초기화]:::process
    
    Start ==> InitApp
    
    subgraph 인증["인증 단계"]
        direction TB
        CheckAuth{"인증 상태 확인"}:::decision
        AuthSuccess[인증 완료]:::process
        
        InitApp ==> CheckAuth
        CheckAuth ==>|인증됨| AuthSuccess
    end
    
    subgraph 메인_선택["메인 선택"]
        direction TB
        MainChoice{"어디로 이동?"}:::decision
        UploadPage[업로드 페이지]:::process
        AnalyzePage[분석 페이지]:::process
        SearchPage[검색 페이지]:::process
        MyPage[마이페이지]:::process
        
        AuthSuccess ==> MainChoice
        MainChoice ==>|새 분석| UploadPage
        MainChoice -->|이전 분석| AnalyzePage
        MainChoice -->|검색| SearchPage
        MainChoice -->|프로필| MyPage
    end
    
    subgraph 업로드_플로우["업로드 플로우"]
        direction TB
        FileSelect[파일 선택]:::process
        SendAnalysis[분석 요청]:::process
        NavigateAnalyze[분석 페이지 이동]:::process
        
        UploadPage ==> FileSelect
        FileSelect ==> SendAnalysis
        SendAnalysis ==> NavigateAnalyze
    end
    
    subgraph 분석_플로우["분석 플로우"]
        direction TB
        CheckAnalysisId{"분석 ID 확인"}:::decision
        LoadFromURL[URL에서 ID 로드]:::process
        LoadFromStorage[localStorage에서 ID 로드]:::process
        LoadAnalysis[분석 데이터 로드]:::process
        ShowResults[결과 표시]:::process
        
        AnalyzePage ==> CheckAnalysisId
        CheckAnalysisId ==>|URL 파라미터| LoadFromURL
        CheckAnalysisId -->|localStorage| LoadFromStorage
        LoadFromURL --> LoadAnalysis
        LoadFromStorage --> LoadAnalysis
        LoadAnalysis ==> ShowResults
    end
    
    subgraph 검색_플로우["검색 플로우"]
        direction TB
        AutoSearch{"자동 검색?"}:::decision
        LoadLastAnalysis[마지막 분석 로드]:::process
        CustomSearch[Custom Search 실행]:::process
        UserInput[사용자 입력 대기]:::process
        TextSearch[텍스트 검색]:::process
        ImageSearch[이미지 검색]:::process
        ShowResults[검색 결과 표시]:::process
        
        SearchPage ==> AutoSearch
        AutoSearch ==>|Yes| LoadLastAnalysis
        AutoSearch -->|No| UserInput
        LoadLastAnalysis ==> CustomSearch
        CustomSearch ==> ShowResults
        UserInput --> TextSearch
        UserInput --> ImageSearch
        TextSearch --> ShowResults
        ImageSearch --> ShowResults
    end
    
    subgraph 마이페이지_플로우["마이페이지 플로우"]
        direction TB
        LoadProfile[프로필 로드]:::process
        LoadHistory[히스토리 로드]:::process
        ShowProfile[프로필 표시]:::process
        ShowHistory[히스토리 표시]:::process
        HistoryAction{"히스토리 액션"}:::decision
        NavigateToAnalysis[분석 페이지로 이동]:::process
        DeleteAnalysis[분석 삭제]:::process
        
        MyPage ==> LoadProfile
        MyPage --> LoadHistory
        LoadProfile ==> ShowProfile
        LoadHistory ==> ShowHistory
        ShowHistory ==> HistoryAction
        HistoryAction ==>|항목 클릭| NavigateToAnalysis
        HistoryAction -->|삭제| DeleteAnalysis
    end
    
    End([작업 완료]):::startEnd
    
    NavigateAnalyze --> End
    ShowResults --> End
    NavigateToAnalysis --> End
    DeleteAnalysis --> End
    
    classDef startEnd fill:#90EE90,stroke:#006400,stroke-width:3px,color:#000
    classDef process fill:#87CEEB,stroke:#4682B4,stroke-width:2px,color:#000
    classDef decision fill:#FFD700,stroke:#FF8C00,stroke-width:2px,color:#000
    classDef error fill:#FF6B6B,stroke:#DC143C,stroke-width:2px,color:#fff
```

---

## 2. 주요 유저 시나리오

### 2.1 시나리오 1: 새 디자인 분석하기

```mermaid
flowchart TD
    Start([사용자: 새 디자인 분석 시작]):::startEnd
    GoUpload[업로드 페이지 이동]:::process
    
    Start ==> GoUpload
    
    subgraph 파일_선택["파일 선택"]
        direction TB
        SelectFile[파일 선택]:::process
        FileType{"파일 타입"}:::decision
        ValidateFile[파일 검증]:::process
        FileError[파일 오류]:::error
        
        GoUpload ==> SelectFile
        SelectFile ==> FileType
        FileType ==>|이미지| ValidateFile
        FileType -.->|기타| FileError
        FileError -.->|재시도| SelectFile
    end
    
    subgraph 미리보기["미리보기"]
        direction TB
        ShowPreview[미리보기 표시]:::process
        OptionalPrompt{"프롬프트 입력?"}:::decision
        EnterPrompt[프롬프트 입력]:::process
        SkipPrompt[프롬프트 건너뛰기]:::process
        
        ValidateFile ==> ShowPreview
        ShowPreview ==> OptionalPrompt
        OptionalPrompt ==>|입력| EnterPrompt
        OptionalPrompt -->|건너뛰기| SkipPrompt
    end
    
    subgraph 분석_요청["분석 요청"]
        direction TB
        SendAnalysis[분석 전송]:::process
        WaitAnalysis[분석 대기]:::process
        AnalysisResult{"분석 결과"}:::decision
        AnalysisSuccess[분석 성공]:::process
        AnalysisError[분석 오류]:::error
        RetryDecision{"재시도?"}:::decision
        
        EnterPrompt --> SendAnalysis
        SkipPrompt --> SendAnalysis
        SendAnalysis ==> WaitAnalysis
        WaitAnalysis ==> AnalysisResult
        AnalysisResult ==>|성공| AnalysisSuccess
        AnalysisResult -.->|실패| AnalysisError
        AnalysisError --> RetryDecision
        RetryDecision -.->|Yes| SendAnalysis
        RetryDecision -.->|No| GoUpload
    end
    
    subgraph 결과_확인["결과 확인"]
        direction TB
        ViewResults[결과 페이지 이동]:::process
        ReviewAnalysis[분석 결과 검토]:::process
        ViewDetails[상세 정보 확인]:::process
        
        AnalysisSuccess ==> ViewResults
        ViewResults ==> ReviewAnalysis
        ReviewAnalysis ==> ViewDetails
    end
    
    End([작업 완료]):::startEnd
    
    ViewDetails ==> End
    
    classDef startEnd fill:#90EE90,stroke:#006400,stroke-width:3px,color:#000
    classDef process fill:#87CEEB,stroke:#4682B4,stroke-width:2px,color:#000
    classDef decision fill:#FFD700,stroke:#FF8C00,stroke-width:2px,color:#000
    classDef error fill:#FF6B6B,stroke:#DC143C,stroke-width:2px,color:#fff
```

### 2.2 시나리오 2: 유사 디자인 찾기

```mermaid
flowchart TD
    Start([사용자: 유사 디자인 찾기]):::startEnd
    GoSearch[검색 페이지 이동]:::process
    
    Start ==> GoSearch
    
    subgraph 자동_검색["자동 검색"]
        direction TB
        CheckLast{"마지막 분석 존재?"}:::decision
        AutoSearch[자동 검색 실행]:::process
        ShowAutoResults[자동 검색 결과 표시]:::process
        
        GoSearch ==> CheckLast
        CheckLast ==>|있음| AutoSearch
        CheckLast -->|없음| ChooseMethod
        AutoSearch ==> ShowAutoResults
    end
    
    subgraph 검색_방법["검색 방법 선택"]
        direction TB
        ChooseMethod{"검색 방법 선택"}:::decision
        MethodType[검색 타입]:::process
        TextSearch[텍스트 검색]:::process
        ImageSearch[이미지 검색]:::process
        FilterSearch[필터 적용 검색]:::process
        
        GoSearch --> ChooseMethod
        ChooseMethod ==> MethodType
        MethodType ==>|텍스트 검색| TextSearch
        MethodType -->|이미지 검색| ImageSearch
        MethodType -->|필터 적용| FilterSearch
    end
    
    subgraph 텍스트_검색["텍스트 검색"]
        direction TB
        EnterText[검색어 입력]:::process
        ValidateText{"검색어 유효?"}:::decision
        PerformTextSearch[텍스트 검색 실행]:::process
        TextError[검색어 오류]:::error
        
        TextSearch ==> EnterText
        EnterText ==> ValidateText
        ValidateText ==>|2자 이상| PerformTextSearch
        ValidateText -.->|2자 미만| TextError
        TextError -.->|재입력| EnterText
    end
    
    subgraph 이미지_검색["이미지 검색"]
        direction TB
        UploadImage[이미지 업로드]:::process
        ValidateImg{"이미지 유효?"}:::decision
        AnalyzeImage[이미지 분석]:::process
        AnalyzeSuccess{"분석 성공?"}:::decision
        SimilarSearch[유사 디자인 검색]:::process
        AnalyzeError[분석 오류]:::error
        
        ImageSearch ==> UploadImage
        UploadImage ==> ValidateImg
        ValidateImg ==>|유효| AnalyzeImage
        ValidateImg -.->|무효| ImageError[이미지 오류]:::error
        ImageError -.->|재업로드| UploadImage
        AnalyzeImage ==> AnalyzeSuccess
        AnalyzeSuccess ==>|성공| SimilarSearch
        AnalyzeSuccess -.->|실패| AnalyzeError
        AnalyzeError -.->|재시도| UploadImage
    end
    
    subgraph 결과_탐색["결과 탐색"]
        direction TB
        ShowResults[검색 결과 표시]:::process
        BrowseResults[결과 탐색]:::process
        ResultAction{"결과 액션"}:::decision
        ViewDetail[상세 보기]:::process
        ShareResult[결과 공유]:::process
        DownloadResult[결과 다운로드]:::process
        SaveResult[결과 저장]:::process
        LoadMore[추가 결과 로드]:::process
        
        PerformTextSearch ==> ShowResults
        SimilarSearch ==> ShowResults
        FilterSearch --> ShowResults
        ShowAutoResults --> ShowResults
        
        ShowResults ==> BrowseResults
        BrowseResults ==> ResultAction
        ResultAction ==>|항목 클릭| ViewDetail
        ResultAction -->|공유| ShareResult
        ResultAction -->|다운로드| DownloadResult
        ResultAction -->|저장| SaveResult
        ResultAction -->|더 보기| LoadMore
        LoadMore --> BrowseResults
    end
    
    End([작업 완료]):::startEnd
    
    ViewDetail ==> End
    ShareResult --> End
    DownloadResult --> End
    SaveResult --> End
    
    classDef startEnd fill:#90EE90,stroke:#006400,stroke-width:3px,color:#000
    classDef process fill:#87CEEB,stroke:#4682B4,stroke-width:2px,color:#000
    classDef decision fill:#FFD700,stroke:#FF8C00,stroke-width:2px,color:#000
    classDef error fill:#FF6B6B,stroke:#DC143C,stroke-width:2px,color:#fff
```

### 2.3 시나리오 3: AI 멘토와 대화하기

```mermaid
flowchart TD
    Start([사용자: AI 멘토와 대화]):::startEnd
    GoAnalyze[분석 페이지 이동]:::process
    
    Start ==> GoAnalyze
    
    subgraph 분석_확인["분석 확인"]
        direction TB
        CheckAnalysis{"분석 데이터 존재?"}:::decision
        LoadAnalysis[분석 데이터 로드]:::process
        RenderAnalysis[분석 결과 렌더링]:::process
        NoAnalysisError[분석 없음 오류]:::error
        
        GoAnalyze ==> CheckAnalysis
        CheckAnalysis ==>|있음| LoadAnalysis
        CheckAnalysis -.->|없음| NoAnalysisError
        LoadAnalysis ==> RenderAnalysis
    end
    
    subgraph 챗_준비["챗 준비"]
        direction TB
        ShowChat[챗 인터페이스 표시]:::process
        CheckSession{"세션 존재?"}:::decision
        LoadHistory[대화 히스토리 로드]:::process
        NewSession[새 세션 시작]:::process
        DisplayHistory[히스토리 표시]:::process
        ReadyChat[챗 준비 완료]:::process
        
        RenderAnalysis ==> ShowChat
        ShowChat ==> CheckSession
        CheckSession ==>|있음| LoadHistory
        CheckSession -->|없음| NewSession
        LoadHistory ==> DisplayHistory
        NewSession --> ReadyChat
        DisplayHistory --> ReadyChat
    end
    
    subgraph 대화["대화 진행"]
        direction TB
        UserInput[사용자 입력]:::process
        InputType{"입력 타입"}:::decision
        TypeMessage[메시지 입력]:::process
        UseSuggestion[제안 사용]:::process
        FillInput[입력란 채우기]:::process
        SendMessage[메시지 전송]:::process
        ValidateInput{"입력 유효?"}:::decision
        EmptyWarning[빈 메시지 경고]:::error
        ShowTyping[타이핑 표시]:::process
        CallChatAPI[챗 API 호출]:::process
        ChatResponse[챗 응답]:::process
        HideTyping[타이핑 숨김]:::process
        DisplayResponse[AI 응답 표시]:::process
        ChatError[챗 오류]:::error
        ShowChatError[챗 오류 메시지]:::error
        RetryChat{"재시도?"}:::decision
        ContinueChat{"계속 대화?"}:::decision
        
        ReadyChat ==> UserInput
        UserInput ==> InputType
        InputType ==>|직접 입력| TypeMessage
        InputType -->|제안 클릭| UseSuggestion
        UseSuggestion --> FillInput
        FillInput --> TypeMessage
        TypeMessage ==> SendMessage
        SendMessage ==> ValidateInput
        ValidateInput ==>|유효| ShowTyping
        ValidateInput -.->|무효| EmptyWarning
        EmptyWarning -.-> UserInput
        ShowTyping ==> CallChatAPI
        CallChatAPI ==> ChatResponse
        ChatResponse ==>|성공| HideTyping
        ChatResponse -.->|실패| ChatError
        HideTyping ==> DisplayResponse
        ChatError -.-> ShowChatError
        ShowChatError --> RetryChat
        RetryChat -.->|Yes| SendMessage
        RetryChat -.->|No| ContinueChat
        DisplayResponse ==> ContinueChat
        ContinueChat ==>|Yes| UserInput
        ContinueChat -->|No| EndChat
    end
    
    EndChat([대화 종료]):::startEnd
    NoAnalysisError -.-> EndChat
    
    ContinueChat -->|No| EndChat
    
    classDef startEnd fill:#90EE90,stroke:#006400,stroke-width:3px,color:#000
    classDef process fill:#87CEEB,stroke:#4682B4,stroke-width:2px,color:#000
    classDef decision fill:#FFD700,stroke:#FF8C00,stroke-width:2px,color:#000
    classDef error fill:#FF6B6B,stroke:#DC143C,stroke-width:2px,color:#fff
```

---

## 3. 페이지별 유저 플로우

### 3.1 업로드 페이지 유저 플로우

```mermaid
flowchart TD
    Start([업로드 페이지 진입]):::startEnd
    InitUpload[업로드 페이지 초기화]:::process
    
    Start ==> InitUpload
    
    subgraph 파일_선택["파일 선택"]
        direction TB
        WaitInteraction[사용자 인터랙션 대기]:::process
        InteractionType{"인터랙션 타입"}:::decision
        OpenFileDialog[파일 선택 다이얼로그]:::process
        HandleDrop[드래그 앤 드롭 처리]:::process
        FileSelected{"파일 선택됨?"}:::decision
        
        InitUpload ==> WaitInteraction
        WaitInteraction ==> InteractionType
        InteractionType ==>|파일 클릭| OpenFileDialog
        InteractionType -->|드래그 앤 드롭| HandleDrop
        OpenFileDialog --> FileSelected
        HandleDrop --> FileSelected
    end
    
    subgraph 파일_검증["파일 검증"]
        direction TB
        ValidateFile[파일 검증]:::process
        FileError[파일 오류 토스트]:::error
        ReadFile[파일 읽기 Base64]:::process
        ShowPreview[미리보기 표시]:::process
        FileReady[파일 준비 완료]:::process
        
        FileSelected ==>|Yes| ValidateFile
        FileSelected -->|No| WaitInteraction
        ValidateFile ==>|유효| ReadFile
        ValidateFile -.->|무효| FileError
        FileError -.->|재시도| WaitInteraction
        ReadFile ==> ShowPreview
        ShowPreview ==> FileReady
    end
    
    subgraph 분석_시작["분석 시작"]
        direction TB
        UserAction{"사용자 액션"}:::decision
        StartAnalysis[분석 시작]:::process
        FillPrompt[프롬프트 자동 입력]:::process
        CheckFile{"파일 선택됨?"}:::decision
        WarnNoFile[파일 선택 필요 경고]:::error
        PrepareRequest[요청 데이터 준비]:::process
        GetPrompt{"프롬프트 입력?"}:::decision
        WithPrompt[프롬프트 포함]:::process
        NoPrompt[프롬프트 없음]:::process
        CallAPI[analyzeDesign API 호출]:::process
        
        FileReady ==> UserAction
        UserAction ==>|전송 버튼| StartAnalysis
        UserAction -->|Enter 키| StartAnalysis
        UserAction -->|추천 버튼| FillPrompt
        FillPrompt --> UserAction
        StartAnalysis ==> CheckFile
        CheckFile -.->|No| WarnNoFile
        WarnNoFile -.-> WaitInteraction
        CheckFile ==>|Yes| PrepareRequest
        PrepareRequest ==> GetPrompt
        GetPrompt ==>|있음| WithPrompt
        GetPrompt -->|없음| NoPrompt
        WithPrompt --> CallAPI
        NoPrompt --> CallAPI
    end
    
    subgraph API_응답["API 응답"]
        direction TB
        APIResult[API 응답]:::process
        StoreId[analysisId localStorage 저장]:::process
        APIError[API 오류 처리]:::error
        ShowAPIError[에러 메시지 표시]:::error
        Navigate[analyze로 이동]:::process
        
        CallAPI ==> APIResult
        APIResult ==>|성공| StoreId
        APIResult -.->|실패| APIError
        StoreId ==> Navigate
        APIError -.-> ShowAPIError
    end
    
    End([분석 페이지 표시]):::startEnd
    EndError([오류 종료]):::startEnd
    
    Navigate ==> End
    ShowAPIError -.-> EndError
    
    classDef startEnd fill:#90EE90,stroke:#006400,stroke-width:3px,color:#000
    classDef process fill:#87CEEB,stroke:#4682B4,stroke-width:2px,color:#000
    classDef decision fill:#FFD700,stroke:#FF8C00,stroke-width:2px,color:#000
    classDef error fill:#FF6B6B,stroke:#DC143C,stroke-width:2px,color:#fff
```

### 3.2 분석 페이지 유저 플로우

```mermaid
flowchart TD
    Start([분석 페이지 진입]):::startEnd
    GetId{"분석 ID 확인"}:::decision
    
    Start ==> GetId
    
    subgraph ID_확인["ID 확인"]
        direction TB
        UseURLId[URL에서 ID 추출]:::process
        UseStorageId[localStorage에서 ID 추출]:::process
        NoIdError[ID 없음 오류]:::error
        ShowErrorMsg[오류 메시지 표시]:::error
        RedirectUpload[업로드 페이지로 리다이렉트]:::error
        
        GetId ==>|URL 파라미터| UseURLId
        GetId -->|localStorage| UseStorageId
        GetId -.->|없음| NoIdError
        NoIdError -.-> ShowErrorMsg
        ShowErrorMsg -.-> RedirectUpload
    end
    
    subgraph 데이터_로드["데이터 로드"]
        direction TB
        LoadAnalysis[분석 데이터 로드]:::process
        ShowSkeleton[스켈레톤 UI 표시]:::process
        CallGetAnalysis[getAnalysis API 호출]:::process
        APIResponse[API 응답]:::process
        AdaptData[데이터 어댑터 적용]:::process
        APIError[API 오류]:::error
        ErrorType[오류 타입]:::process
        NetworkError[네트워크 오류 UI]:::error
        NotFoundError[찾을 수 없음 UI]:::error
        TimeoutError[타임아웃 UI]:::error
        ServerError[서버 오류 UI]:::error
        RetryButton{"재시도 버튼?"}:::decision
        
        UseURLId --> LoadAnalysis
        UseStorageId --> LoadAnalysis
        LoadAnalysis ==> ShowSkeleton
        ShowSkeleton ==> CallGetAnalysis
        CallGetAnalysis ==> APIResponse
        APIResponse ==>|성공| AdaptData
        APIResponse -.->|실패| APIError
        APIError -.-> ErrorType
        ErrorType -.->|네트워크| NetworkError
        ErrorType -.->|404| NotFoundError
        ErrorType -.->|타임아웃| TimeoutError
        ErrorType -.->|서버| ServerError
        NetworkError --> RetryButton
        NotFoundError --> RetryButton
        TimeoutError --> RetryButton
        ServerError --> RetryButton
        RetryButton -.->|Yes| LoadAnalysis
    end
    
    subgraph 결과_표시["결과 표시"]
        direction TB
        HideSkeleton[스켈레톤 숨김]:::process
        RenderAll[전체 결과 렌더링]:::process
        RenderHeader[헤더 렌더링]:::process
        RenderKeywords[키워드 렌더링]:::process
        RenderOverall[종합 분석 렌더링]:::process
        RenderBoxes[데이터 박스 렌더링]:::process
        RenderAISuggestion[AI 제안 렌더링]:::process
        RenderChatSuggestions[챗 제안 렌더링]:::process
        SetupModals[모달 이벤트 설정]:::process
        SetupChat[챗 이벤트 설정]:::process
        PageReady[페이지 준비 완료]:::process
        
        AdaptData ==> HideSkeleton
        HideSkeleton ==> RenderAll
        RenderAll ==> RenderHeader
        RenderHeader ==> RenderKeywords
        RenderKeywords ==> RenderOverall
        RenderOverall ==> RenderBoxes
        RenderBoxes ==> RenderAISuggestion
        RenderAISuggestion ==> RenderChatSuggestions
        RenderChatSuggestions ==> SetupModals
        SetupModals ==> SetupChat
        SetupChat ==> PageReady
    end
    
    subgraph 사용자_인터랙션["사용자 인터랙션"]
        direction TB
        UserInteraction[사용자 인터랙션]:::process
        OpenDetailModal[상세 모달 열기]:::process
        ShowModalContent[모달 내용 표시]:::process
        ModalClose{"모달 닫기?"}:::decision
        CloseModal[모달 닫기]:::process
        SendChat[챗 메시지 전송]:::process
        FillChatInput[챗 입력란 채우기]:::process
        ValidateMessage{"메시지 유효?"}:::decision
        WarnEmpty[빈 메시지 경고]:::error
        AddUserMsg[사용자 메시지 추가]:::process
        ShowTyping[타이핑 인디케이터 표시]:::process
        CallChatAPI[chatWithMentor API 호출]:::process
        ChatResponse[챗 응답]:::process
        StoreSession[세션 ID 저장]:::process
        ChatError[챗 오류]:::error
        HideTyping[타이핑 인디케이터 숨김]:::process
        AddAIMsg[AI 메시지 추가]:::process
        ScrollChat[챗 스크롤]:::process
        ShowChatError[챗 오류 메시지]:::error
        
        PageReady ==> UserInteraction
        
        UserInteraction ==>|데이터 박스 클릭| OpenDetailModal
        OpenDetailModal ==> ShowModalContent
        ShowModalContent --> ModalClose
        ModalClose -->|Yes| CloseModal
        ModalClose -->|No| ShowModalContent
        CloseModal --> UserInteraction
        
        UserInteraction ==>|챗 메시지 입력| SendChat
        UserInteraction -->|제안 클릭| FillChatInput
        FillChatInput --> UserInteraction
        
        SendChat ==> ValidateMessage
        ValidateMessage ==>|Yes| AddUserMsg
        ValidateMessage -.->|No| WarnEmpty
        WarnEmpty -.-> UserInteraction
        AddUserMsg ==> ShowTyping
        ShowTyping ==> CallChatAPI
        CallChatAPI ==> ChatResponse
        ChatResponse ==>|성공| StoreSession
        ChatResponse -.->|실패| ChatError
        StoreSession ==> HideTyping
        HideTyping ==> AddAIMsg
        AddAIMsg ==> ScrollChat
        ScrollChat --> UserInteraction
        ChatError -.-> ShowChatError
        ShowChatError -.-> UserInteraction
    end
    
    End([대기 상태]):::startEnd
    EndError([오류 종료]):::startEnd
    
    RedirectUpload -.-> EndError
    RetryButton -.->|No| EndError
    UserInteraction --> End
    
    classDef startEnd fill:#90EE90,stroke:#006400,stroke-width:3px,color:#000
    classDef process fill:#87CEEB,stroke:#4682B4,stroke-width:2px,color:#000
    classDef decision fill:#FFD700,stroke:#FF8C00,stroke-width:2px,color:#000
    classDef error fill:#FF6B6B,stroke:#DC143C,stroke-width:2px,color:#fff
```

---

## 유저 플로우 요약

### 주요 진입점
1. **업로드 페이지** (`index.html`) - 새 디자인 분석 시작
2. **분석 페이지** (`analyze.html`) - 분석 결과 확인 및 AI 대화
3. **검색 페이지** (`searchTab.html`) - 유사 디자인 검색
4. **마이페이지** (`mypage.html`) - 프로필 및 히스토리 관리

### 주요 사용자 여정
1. **첫 사용자**: 인증 → 업로드 → 분석 → 결과 확인
2. **재방문 사용자**: 인증 → 메인 선택 → 원하는 기능 사용
3. **AI 멘토 대화**: 분석 페이지 → 챗 시작 → 대화 진행
4. **유사 디자인 검색**: 검색 페이지 → 검색 방법 선택 → 결과 탐색

### 주요 터치포인트
- 파일 업로드 (드래그 앤 드롭 또는 파일 선택)
- 분석 결과 시각화
- AI 멘토 챗 인터페이스
- 검색 결과 카드
- 히스토리 목록

---

**문서 끝**
