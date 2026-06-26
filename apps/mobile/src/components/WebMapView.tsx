// ── WebMapView ──────────────────────────────────────────────────────────
// Drop-in replacement for react-native-maps MapView using Leaflet/OpenStreetMap.
// No API key needed — completely free, works offline-ready.

import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
  useEffect,
} from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { GENERATED_MAP_HTML } from './webMapHtml';

const WebView = Platform.OS === 'web' ? null : require('react-native-webview').WebView;

// ── Types ────────────────────────────────────────────────────────────────
export interface Bounds {
  northEast: { lat: number; lng: number };
  southWest: { lat: number; lng: number };
}

export interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
  zoom?: number;
  northEast?: { lat: number; lng: number };
  southWest?: { lat: number; lng: number };
}

export interface MapMarkerData {
  id: string;
  latitude: number;
  longitude: number;
  emoji: string;
  color: string;
  isSelected: boolean;
  isSaved?: boolean;
  showSavedLayer?: boolean;
  count?: number;
  markerType?: 'cluster' | 'google_business' | 'verified' | '24hour' | 'popular';
}

export type MapLayerType = 'standard' | 'dark' | 'satellite' | 'terrain' | 'light';

export interface WebMapViewProps {
  style?: any;
  initialRegion: Region;
  markers: MapMarkerData[];
  onRegionChangeComplete?: (region: Region) => void;
  onBoundsChanged?: (bounds: Bounds, zoom: number) => void;
  onMapReady?: () => void;
  onMarkerPress?: (id: string) => void;
  onUserLocation?: (location: { latitude: number; longitude: number }) => void;
  onLayerChange?: (layer: MapLayerType) => void;
  showsUserLocation?: boolean;
  followsUserLocation?: boolean;
  mapType?: MapLayerType;
  userLocation?: { latitude: number; longitude: number; accuracy?: number; heading?: number } | null;
}

export interface WebMapViewRef {
  animateToRegion: (region: Region, duration?: number) => void;
  setMapLayer: (layer: MapLayerType) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetBearing: () => void;
  setTraffic: (enabled: boolean) => void;
}

// ── Component ────────────────────────────────────────────────────────────
const WebMapView = forwardRef<WebMapViewRef, WebMapViewProps>((props, ref) => {
  const {
    style,
    initialRegion,
    markers,
    onRegionChangeComplete,
    onBoundsChanged,
    onMapReady,
    onMarkerPress,
    onUserLocation,
    onLayerChange,
    showsUserLocation,
    followsUserLocation,
    mapType,
    userLocation,
  } = props;

  const webViewRef = useRef<any>(null);
  const [webViewReady, setWebViewReady] = useState(false);
  const followRef = useRef(followsUserLocation);
  followRef.current = followsUserLocation;

  // ── Expose imperative methods ──────────────────────────────────────────
  useImperativeHandle(ref, () => ({
    animateToRegion: (region: Region, duration: number = 500) => {
      sendMessage('animateTo', { ...region, duration });
    },
    setMapLayer: (layer: MapLayerType) => {
      sendMessage('setMapLayer', layer);
    },
    zoomIn: () => {
      sendMessage('zoomIn', null);
    },
    zoomOut: () => {
      sendMessage('zoomOut', null);
    },
    resetBearing: () => {
      sendMessage('resetBearing', null);
    },
    setTraffic: (enabled: boolean) => {
      sendMessage('setTraffic', enabled);
    },
  }));

  // ── Send message to WebView ────────────────────────────────────────────
  const sendMessage = useCallback((type: string, payload: any) => {
    if (webViewRef.current) {
      webViewRef.current.postMessage(JSON.stringify({ type, payload }));
    }
  }, []);

  // ── Receive message from WebView ───────────────────────────────────────
  const handleMessage = useCallback(
    (event: any) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);
        switch (data.type) {
          case 'mapReady':
            setWebViewReady(true);
            onMapReady?.();
            break;
          case 'regionChange':
            onRegionChangeComplete?.(data.payload);
            if (data.payload.northEast && data.payload.southWest && data.payload.zoom != null) {
              onBoundsChanged?.(
                {
                  northEast: data.payload.northEast,
                  southWest: data.payload.southWest,
                },
                data.payload.zoom,
              );
            }
            break;
          case 'markerPress':
            onMarkerPress?.(data.payload.id);
            break;
          case 'userLocation':
            onUserLocation?.(data.payload);
            break;
          case 'layerChanged':
            onLayerChange?.(data.payload.layer);
            break;
        }
      } catch {}
    },
    [onMapReady, onRegionChangeComplete, onBoundsChanged, onMarkerPress, onUserLocation, onLayerChange],
  );

  // ── Send markers to WebView when they change ───────────────────────────
  useEffect(() => {
    if (webViewReady && markers) {
      sendMessage('setMarkers', markers);
    }
  }, [markers, webViewReady, sendMessage]);

  // ── Send followUser to WebView ─────────────────────────────────────────
  useEffect(() => {
    if (webViewReady) {
      sendMessage('setFollowUser', !!followsUserLocation);
    }
  }, [followsUserLocation, webViewReady, sendMessage]);

  // ── Send mapType to WebView when it changes ─────────────────────────────
  useEffect(() => {
    if (webViewReady && mapType) {
      sendMessage('setMapLayer', mapType);
    }
  }, [mapType, webViewReady, sendMessage]);

  // ── Send user location to WebView ──────────────────────────────────────
  useEffect(() => {
    if (webViewReady && userLocation && showsUserLocation) {
      sendMessage('setUserLocation', userLocation);
    }
  }, [userLocation, webViewReady, showsUserLocation, sendMessage]);

  // ── Inject initial region on mount ─────────────────────────────────────
  const injectedJS = `
    if (window.handleRNMessage) {
      window.handleRNMessage({ data: ${JSON.stringify(JSON.stringify({
        type: 'setInitialRegion',
        payload: initialRegion,
      }))} });
    }
    true;
  `;

  // ── Cleanup on unmount ────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      // Stop WebView loading to prevent memory leaks
      if (webViewRef.current) {
        try {
          webViewRef.current.stopLoading();
        } catch {}
        webViewRef.current = null;
      }
    };
  }, []);

  return (
    <View style={[styles.container, style]}>
      {Platform.OS === 'web' ? (
        <iframe
          srcDoc={GENERATED_MAP_HTML}
          style={{ width: '100%', height: '100%', border: 'none' }}
        />
      ) : (
        <WebView
          ref={webViewRef}
          style={styles.webview}
          source={{ html: GENERATED_MAP_HTML }}
          onMessage={handleMessage}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={false}
          scrollEnabled={false}
          bounces={false}
          overScrollMode="never"
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          allowFileAccess={true}
          mixedContentMode="always"
          androidLayerType="hardware"
          // Inject initial region before tiles load (both iOS and Android)
          injectedJavaScript={injectedJS}
          // Prevent unnecessary reloads when parent re-renders
          key="nex-map-webview"
        />
      )}
    </View>
  );
});

WebMapView.displayName = 'WebMapView';

const styles = StyleSheet.create({
  container: { overflow: 'hidden' },
  webview: { backgroundColor: '#F5F5F5' },
});

export default WebMapView;
