import { useState } from "react";

export const useResearchPopups = (API_URL) => {
  const [selectedResearch, setSelectedResearch] = useState(null);
  const [selectedPdf, setSelectedPdf] = useState(null);

  const [showPopup, setShowPopup] = useState(false);
  const [showPdfPopup, setShowPdfPopup] = useState(false);

  const [loadingResearch, setLoadingResearch] = useState(false);
  const [loadingPdf, setLoadingPdf] = useState(false);

  const handleViewResearch = async (id) => {
    setShowPopup(true);
    setLoadingResearch(true);
    setSelectedResearch(null);

    try {
      const response = await fetch(`${API_URL}/api/research/${id}`);

      if (!response.ok) {
        throw new Error(`Failed to load research (${response.status})`);
      }

      const data = await response.json();
      setSelectedResearch(data);
    } catch (error) {
      console.error("Error loading research:", error);
      setSelectedResearch({
        title: "Error",
        summary: "Unable to load this research.",
      });
    } finally {
      setLoadingResearch(false);
    }
  };

  const handleViewPdfText = async (id) => {
    setShowPdfPopup(true);
    setLoadingPdf(true);
    setSelectedPdf(null);

    try {
      const response = await fetch(`${API_URL}/api/research/${id}`);

      if (!response.ok) {
        throw new Error(`Failed to load PDF text (${response.status})`);
      }

      const data = await response.json();
      setSelectedPdf(data);
    } catch (error) {
      console.error("Error loading PDF text:", error);
      setSelectedPdf({
        title: "Error",
        content: "Unable to load the PDF text.",
      });
    } finally {
      setLoadingPdf(false);
    }
  };

  const closePopup = () => {
    setShowPopup(false);
    setSelectedResearch(null);
  };

  const closePdfPopup = () => {
    setShowPdfPopup(false);
    setSelectedPdf(null);
  };

  return {
    selectedResearch,
    selectedPdf,
    showPopup,
    showPdfPopup,
    loadingResearch,
    loadingPdf,
    handleViewResearch,
    handleViewPdfText,
    closePopup,
    closePdfPopup,
  };
};
