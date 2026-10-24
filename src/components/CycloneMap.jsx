/**
 * City-Meet 暗黑地圖圖層與 Canvas 氣旋整合元件
 * 使用 CartoDB DarkMatter 向量瓦片（完全開源零金鑰）
 * 上層疊加高效能 CycloneEngine Canvas 粒子視圖
 */

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { CycloneEngine } from './CycloneCanvas';
import { Compass, Plus, Minus, Navigation } from 'lucide-react';

export default function CycloneMap({
  events,
  selectedEvent,
  onSelectEvent,
  isMobile
}) {
  const mapContainerRef = useRef(null);
  const canvasRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const engineRef = useRef(null);

  // 初始化 Leaflet 地圖與 Canvas 引擎
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // 1. 建立 Leaflet 地圖實例，預設中心為台北車站/市府商圈一帶
    const map = L.map(mapContainerRef.current, {
      center: [25.0380, 121.5350],
      zoom: isMobile ? 12 : 13,
      minZoom: 10,
      maxZoom: 18,
      zoomControl: false,
      attributionControl: false
    });

    // 2. 載入官方開源 OpenStreetMap 圖資（搭配全域暗黑濾鏡，100% 免金鑰、零水印）
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(map);

    mapInstanceRef.current = map;

    // 3. 初始化 Canvas 氣旋引擎
    if (canvasRef.current) {
      const engine = new CycloneEngine(canvasRef.current, {
        isMobile,
        onSelectEvent: (event) => {
          if (onSelectEvent) onSelectEvent(event);
        }
      });

      // 提供座標投影計算給引擎 (LatLng -> ContainerPoint)
      engine.setCoordProjection((lat, lng) => {
        if (!mapInstanceRef.current) return null;
        const pt = mapInstanceRef.current.latLngToContainerPoint([lat, lng]);
        return { x: pt.x, y: pt.y };
      });

      engine.resize();
      engine.setEvents(events);
      engine.start();

      engineRef.current = engine;

      // 4. 監聽地圖移動、縮放，使 Canvas 與地圖完全即時鎖定
      const handleMapUpdate = () => {
        engine.resize();
      };

      map.on('move', handleMapUpdate);
      map.on('zoom', handleMapUpdate);
      map.on('resize', handleMapUpdate);

      // 5. 轉發地圖滑鼠移動與點擊至 Canvas 引擎（讓地圖可以完全自由拖拉）
      map.on('mousemove', (e) => {
        if (engineRef.current) {
          const pt = e.containerPoint;
          const isHover = engineRef.current.setMousePosition(pt.x, pt.y);
          if (mapContainerRef.current) {
            mapContainerRef.current.style.cursor = isHover ? 'pointer' : '';
          }
        }
      });

      map.on('click', (e) => {
        if (engineRef.current) {
          const pt = e.containerPoint;
          engineRef.current.handleCoordClick(pt.x, pt.y);
        }
      });
    }

    return () => {
      if (engineRef.current) {
        engineRef.current.destroy();
        engineRef.current = null;
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 當 events 變更時更新引擎
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setEvents(events);
    }
  }, [events]);

  // 當 selectedEvent 變更時，平滑移動地圖中心
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setSelectedEventId(selectedEvent ? selectedEvent.id : null);
    }

    if (selectedEvent && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(
        selectedEvent.coordinates,
        Math.max(mapInstanceRef.current.getZoom(), 14),
        { duration: 1.2, easeLinearity: 0.25 }
      );
    }
  }, [selectedEvent]);

  // 控制項：縮放與復位
  const handleZoomIn = () => mapInstanceRef.current && mapInstanceRef.current.zoomIn();
  const handleZoomOut = () => mapInstanceRef.current && mapInstanceRef.current.zoomOut();
  const handleResetView = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([25.0380, 121.5350], isMobile ? 12 : 13);
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      {/* 底層 Leaflet 地圖容器 */}
      <div
        ref={mapContainerRef}
        style={{ width: '100%', height: '100%', zIndex: 1 }}
      />

      {/* 上層動態氣旋 Canvas 畫布 */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 2,
          pointerEvents: 'none'
        }}
      />

      {/* 地圖自訂漂浮控制面板 */}
      <div
        style={{
          position: 'absolute',
          right: '16px',
          bottom: isMobile ? '80px' : '24px',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}
      >
        <button
          onClick={handleResetView}
          title="回台北中心"
          className="glass-panel"
          style={{
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-cyan)',
            cursor: 'pointer',
            border: '1px solid var(--border-subtle)',
            borderRadius: '10px'
          }}
        >
          <Compass size={20} />
        </button>
        <button
          onClick={handleZoomIn}
          title="放大"
          className="glass-panel"
          style={{
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            cursor: 'pointer',
            border: '1px solid var(--border-subtle)',
            borderRadius: '10px'
          }}
        >
          <Plus size={20} />
        </button>
        <button
          onClick={handleZoomOut}
          title="縮小"
          className="glass-panel"
          style={{
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            cursor: 'pointer',
            border: '1px solid var(--border-subtle)',
            borderRadius: '10px'
          }}
        >
          <Minus size={20} />
        </button>
      </div>

      {/* 城市社交氣象台地圖微光浮水印標籤 */}
      <div
        style={{
          position: 'absolute',
          left: '16px',
          bottom: isMobile ? '80px' : '16px',
          zIndex: 5,
          pointerEvents: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 12px',
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(8px)',
          borderRadius: '9999px',
          border: '1px solid rgba(255,255,255,0.06)',
          fontSize: '11px',
          color: 'var(--text-muted)'
        }}
      >
        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-cyan)', display: 'inline-block' }} className="radar-wave" />
        <span>即時能量觀測中・極座標粒子引擎</span>
      </div>
    </div>
  );
}
