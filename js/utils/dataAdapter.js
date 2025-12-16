// 데이터 어댑터: Firestore → 프론트엔드 표시 형식 변환
// 참조: dysapp_SRD.md Section 3, dysapp_TSD.md Section 6

/**
 * Firestore AnalysisDocument를 프론트엔드 표시 형식으로 변환
 * @param {Object} backendResult - 백엔드에서 받은 AnalysisDocument (camelCase)
 * @returns {Object} 프론트엔드 표시 형식
 * 참조: dysapp_SRD.md Section 3.1
 */
export function adaptAnalysisResult(backendResult) {
  // analysisId가 없으면 id 사용
  const analysisId = backendResult.analysisId || backendResult.id;
  
  return {
    // 기본 정보
    analysisId: analysisId,
    imageUrl: backendResult.imageUrl,
    fileName: backendResult.fileName,
    formatPrediction: backendResult.formatPrediction,
    overallScore: backendResult.overallScore,
    fixScope: backendResult.fixScope,

    // Layer 1: Performance & Information (50%)
    layer1: {
      hierarchyScore: backendResult.layer1Metrics?.hierarchyScore || 0,
      scanabilityScore: backendResult.layer1Metrics?.scanabilityScore || 0,
      goalClarityScore: backendResult.layer1Metrics?.goalClarityScore || 0,
      accessibility: backendResult.layer1Metrics?.accessibility || {
        lowContrast: false,
        tinyText: false,
        cluttered: false
      },
      diagnosisSummary: backendResult.layer1Metrics?.diagnosisSummary || ''
    },

    // Layer 2: Form & Aesthetic (30%)
    layer2: {
      gridConsistency: backendResult.layer2Metrics?.gridConsistency || 0,
      visualBalance: backendResult.layer2Metrics?.visualBalance || 0,
      colorHarmony: backendResult.layer2Metrics?.colorHarmony || 0,
      typographyQuality: backendResult.layer2Metrics?.typographyQuality || 0
    },

    // Layer 3: Communicative Impact (20%)
    layer3: {
      trustVibe: backendResult.layer3Metrics?.trustVibe || 'Medium',
      engagementPotential: backendResult.layer3Metrics?.engagementPotential || 'Medium',
      emotionalTone: backendResult.layer3Metrics?.emotionalTone || 'Calm'
    },

    // 기타
    colorPalette: backendResult.colorPalette || [],
    detectedKeywords: backendResult.detectedKeywords || [],
    nextActions: backendResult.nextActions || [],
    ragSearchQueries: backendResult.ragSearchQueries || []
  };
}

/**
 * 날짜 포맷 변환 (Timestamp → 문자열)
 * @param {Object} timestamp - Firestore Timestamp
 * @returns {string} 포맷된 날짜 문자열
 */
export function formatDate(timestamp) {
  if (!timestamp) return '';
  
  // Firestore Timestamp인 경우
  if (timestamp.toDate) {
    const date = timestamp.toDate();
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  // 이미 Date 객체인 경우
  if (timestamp instanceof Date) {
    return timestamp.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  return '';
}

