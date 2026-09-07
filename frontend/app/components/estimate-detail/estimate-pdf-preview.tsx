import { useState, useRef, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, ZoomIn, ZoomOut } from "lucide-react";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// PDF.js workerの設定
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface EstimatePdfPreviewProps {
  pdfUrl: string;
  filename?: string;
}

export function EstimatePdfPreview({
  pdfUrl,
  filename = "見積書.pdf",
}: EstimatePdfPreviewProps) {
  const [scale, setScale] = useState<number>(1.0);
  const containerRef = useRef<HTMLDivElement>(null);

  // コンテナの幅を監視してスケールを自動調整
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width;

        // A4サイズの幅を基準に自動スケール計算
        const baseScale = Math.min((width - 32) / 595, 1.5);
        setScale(Math.max(baseScale, 0.5));
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = pdfUrl;
    link.download = filename;
    link.click();
  };

  const zoomIn = () => {
    setScale((prev) => Math.min(prev + 0.2, 2.0));
  };

  const zoomOut = () => {
    setScale((prev) => Math.max(prev - 0.2, 0.5));
  };

  return (
    <Card className="p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <FileText className="w-5 h-5" />
          プレビュー
        </h2>
        <div className="flex items-center gap-2">
          {pdfUrl && (
            <>
              <div className="flex items-center gap-1">
                <Button
                  onClick={zoomOut}
                  variant="outline"
                  size="sm"
                  disabled={scale <= 0.5}
                >
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <Button
                  onClick={zoomIn}
                  variant="outline"
                  size="sm"
                  disabled={scale >= 2.0}
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
              </div>
              <Button onClick={handleDownload} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                ダウンロード
              </Button>
            </>
          )}
        </div>
      </div>

      <div
        ref={containerRef}
        className="bg-muted rounded-lg overflow-auto border flex-1 flex items-start justify-center"
      >
        {pdfUrl ? (
          <Document
            file={pdfUrl}
            loading={
              <div className="flex items-center justify-center p-8">
                <div
                  className="bg-white"
                  style={{
                    width: `${595 * scale}px`,
                    height: `${842 * scale}px`,
                  }}
                />
              </div>
            }
            error={
              <div className="flex items-center justify-center p-8">
                <p className="text-destructive">PDFの読み込みに失敗しました</p>
              </div>
            }
          >
            <Page
              pageNumber={1}
              scale={scale}
              renderTextLayer={true}
              renderAnnotationLayer={true}
              loading={
                <div
                  className="bg-white"
                  style={{
                    width: `${595 * scale}px`,
                    height: `${842 * scale}px`,
                  }}
                />
              }
            />
          </Document>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div
              className="bg-white"
              style={{
                width: `${595 * scale}px`,
                height: `${842 * scale}px`,
              }}
            />
          </div>
        )}
      </div>
    </Card>
  );
}
