"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { useSocket } from "@/src/context/socket-context";
import { useSpaces } from "@/src/context/spaces-context";
import { useWorkspace } from "@/src/context/workspace-context";
import "@excalidraw/excalidraw/index.css";
import { toast } from "sonner";
import { spacesApi } from "@/src/lib/api/spaces";
import { Trash2, Edit } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";

const Excalidraw = dynamic(
  () => import("@excalidraw/excalidraw").then((mod) => mod.Excalidraw),
  { ssr: false }
);

interface KnowledgeCardSelection {
  itemId: string;
  elementId: string;
  x: number;
  y: number;
}

export default function CollaborativeWhiteboard() {
  const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null);
  const { socket } = useSocket();
  const { 
    currentSpace, 
    registerSaveHandler, 
    selectedTool, 
    setSelectedTool 
  } = useSpaces();
  const { currentWorkspace } = useWorkspace();
  
  const [selectedCard, setSelectedCard] = useState<KnowledgeCardSelection | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const lastSyncedElements = useRef<any[]>([]);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const canEdit = currentWorkspace?.role === "OWNER" || currentWorkspace?.role === "EDITOR";

  const loadSpaceElements = useCallback(async () => {
    if (!currentSpace || !currentWorkspace) return;

    try {
      if (excalidrawAPI) {
          excalidrawAPI.resetScene();
      }

      const spaceData = await spacesApi.getSpace(
        currentWorkspace.id,
        currentSpace.id
      );

      if (spaceData.elements && excalidrawAPI) {
        const elementsToLoad = spaceData.elements.map((el: any) => el.content);
        excalidrawAPI.updateScene({ elements: elementsToLoad });
        lastSyncedElements.current = elementsToLoad;
      } else {
        lastSyncedElements.current = [];
      }
    } catch (error) {
      console.error("Failed to load space elements:", error);
      toast.error("Failed to load space content");
    }
  }, [currentSpace, currentWorkspace, excalidrawAPI]);

  useEffect(() => {
    if (currentSpace && excalidrawAPI) {
      loadSpaceElements();
    }
  }, [currentSpace, excalidrawAPI, loadSpaceElements]);

  useEffect(() => {
    if (!socket || !currentSpace || !excalidrawAPI) return;

    socket.emit('subscribe:space', currentSpace.id);

    const handleElementCreated = (data: any) => {
        console.log('Socket received element:created', data);
        if (data.spaceId !== currentSpace.id) return;
        const element = data.element?.content;
        if (!element) return;
        
        const sceneElements = excalidrawAPI.getSceneElements();
        if (sceneElements.some((el: any) => el.id === element.id)) {
             lastSyncedElements.current = [...lastSyncedElements.current, element];
             return;
        }
        
        excalidrawAPI.updateScene({ elements: [...sceneElements, element] });
        lastSyncedElements.current = [...lastSyncedElements.current, element];
    };

    const handleElementUpdated = (data: any) => {
        console.log('Socket received element:updated/moved', data);
        if (data.spaceId !== currentSpace.id) return;
        const element = data.element?.content;
        if (!element) return;
        
        const sceneElements = excalidrawAPI.getSceneElements();
        const selectedIds = excalidrawAPI.getAppState().selectedElementIds;
        if (selectedIds && selectedIds[element.id]) return;

        const newElements = sceneElements.map((el: any) => el.id === element.id ? element : el);
        if (!sceneElements.find((el:any) => el.id === element.id)) {
            newElements.push(element);
        }

        excalidrawAPI.updateScene({ elements: newElements });

        lastSyncedElements.current = lastSyncedElements.current.map(e => e.id === element.id ? element : e);
        if (!lastSyncedElements.current.find(e => e.id === element.id)) {
             lastSyncedElements.current.push(element);
        }
    };

    const handleElementDeleted = (data: any) => {
        console.log('Socket received element:deleted', data);
        if (data.spaceId !== currentSpace.id) return;
        
        const elId = data.id || data.content?.id;
        if (!elId) return;
        
        const sceneElements = excalidrawAPI.getSceneElements();
        const newElements = sceneElements.map((el: any) => 
            el.id === elId ? { ...el, isDeleted: true } : el
        );
        excalidrawAPI.updateScene({ elements: newElements });
        
        lastSyncedElements.current = lastSyncedElements.current.filter(e => e.id !== elId);
    };

    socket.on('element:created', handleElementCreated);
    socket.on('element:updated', handleElementUpdated);
    socket.on('element:moved', handleElementUpdated); 
    socket.on('element:deleted', handleElementDeleted);

    return () => {
        socket.emit('unsubscribe:space', currentSpace.id);
        socket.off('element:created', handleElementCreated);
        socket.off('element:updated', handleElementUpdated);
        socket.off('element:moved', handleElementUpdated);
        socket.off('element:deleted', handleElementDeleted);
    };
  }, [socket, currentSpace, excalidrawAPI]);

  const saveElements = useCallback(async (force = false) => {
    if (!currentSpace || !currentWorkspace || !canEdit || !excalidrawAPI) return;

    const currentElements = excalidrawAPI.getSceneElements();
    
    if (!force && JSON.stringify(currentElements) === JSON.stringify(lastSyncedElements.current)) {
      return;
    }

    try {
      const newElements = currentElements.filter(
        (el: any) => !lastSyncedElements.current.find(
             (synced) => synced.id === el.id && synced.version === el.version
        )
      );

      if (newElements.length > 0) {
        await spacesApi.batchCreateElements(
          currentWorkspace.id,
          currentSpace.id,
          newElements.map((el: any) => ({ type: el.type, content: el }))
        );
      }

      lastSyncedElements.current = currentElements;
      if (force) toast.success("Space saved successfully");
    } catch (error) {
      console.error("Failed to save space:", error);
      if (force) toast.error("Failed to save space");
    }
  }, [currentSpace, currentWorkspace, canEdit, excalidrawAPI]);

  useEffect(() => {
    registerSaveHandler(async () => {
        await saveElements(true);
    });
    return () => registerSaveHandler(async () => {}); 
  }, [registerSaveHandler, saveElements]);

  const handleChange = useCallback((elements: readonly any[], appState: any) => {
    if (appState.selectedElementIds) {
      const selectedIds = Object.keys(appState.selectedElementIds);
      if (selectedIds.length > 0) {
        const selectedEl = elements.find(el => el.id === selectedIds[0]);
        if (selectedEl) {
             const cardInfo = selectedEl.customData?.isKnowledgeCard ? selectedEl : 
                              (selectedEl.groupIds.length > 0 ? 
                               elements.find(el => el.groupIds.includes(selectedEl.groupIds[0]) && el.customData?.isKnowledgeCard) 
                               : null);
             
             if (cardInfo && cardInfo.customData?.itemId) {
               
               const vx = (cardInfo.x + appState.scrollX) * appState.zoom.value + (appState.offsetLeft || 0);
               const vy = (cardInfo.y + appState.scrollY) * appState.zoom.value + (appState.offsetTop || 0);
               
               setSelectedCard(prev => {
                  if (prev?.elementId === cardInfo.id && prev?.x === vx && prev?.y === vy - 50) return prev;
                  return {
                     itemId: cardInfo.customData.itemId,
                     elementId: cardInfo.id,
                     x: vx,
                     y: vy - 50 
                   };
               });
             } else {
               setSelectedCard(prev => prev ? null : prev);
             }
        } else {
            setSelectedCard(prev => prev ? null : prev);
        }
      } else {
        setSelectedCard(prev => prev ? null : prev);
      }
    }

    if (!canEdit) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveElements(false);
    }, 2000);
  }, [canEdit, saveElements]);

  const handleDeleteCard = () => {
    setIsDeleteConfirmOpen(true);
  };

  const executeDeleteCard = async () => {
    if (!selectedCard || !currentWorkspace) return;
    
    try {
             if (excalidrawAPI) {
                 const elements = excalidrawAPI.getSceneElements();
                 const el = elements.find((e:any) => e.id === selectedCard.elementId);
                 if (el && el.groupIds.length > 0) {
                     const groupId = el.groupIds[0];
                     const newElements = elements.map((e:any) => {
                         if (e.groupIds.includes(groupId)) {
                             return { ...e, isDeleted: true };
                         }
                         return e;
                     });
                     excalidrawAPI.updateScene({ elements: newElements });
                     saveElements(false);
                     toast.success("Link removed from whiteboard");
                 }
             }
             setSelectedCard(null);
             setIsDeleteConfirmOpen(false);
    } catch (e) {
        console.error(e);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!canEdit) {
      toast.error("You don't have permission to edit this space");
      return;
    }

    const data = e.dataTransfer.getData("application/json");
    if (!data || !excalidrawAPI) return;

    try {
      const item = JSON.parse(data);
      
      const appState = excalidrawAPI.getAppState();
      const elements = excalidrawAPI.getSceneElements();

      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const sceneX = (x - (appState.offsetLeft || 0)) / appState.zoom.value - appState.scrollX;
      const sceneY = (y - (appState.offsetTop || 0)) / appState.zoom.value - appState.scrollY;

      let newElements: unknown[] = [];

      if (item.type === "link" || item.url) {
           const groupId = `group-${Date.now()}-${Math.random()}`;
           const cardWidth = 240;
           // Adjust height if there is intent/write-up
           const cardHeight = item.userIntent ? 140 : 80;
           
           const cardBg = {
            type: "rectangle",
            x: sceneX,
            y: sceneY,
            width: cardWidth,
            height: cardHeight,
            angle: 0,
            strokeColor: "#94a3b8", // Darker border (Slate 400) for better visibility
            backgroundColor: "#ffffff",
            fillStyle: "solid",
            strokeWidth: 1,
            strokeStyle: "solid",
            roughness: 0,
            opacity: 100,
            groupIds: [groupId],
            roundness: { type: 3 }, 
            seed: Math.random(),
            version: 1,
            versionNonce: 0,
            isDeleted: false,
            boundElements: null,
            updated: Date.now(),
            id: `card-bg-${Date.now()}-${Math.random()}`,
            customData: { isKnowledgeCard: true, itemId: item.itemId, link: item.url }
           };

           const labelText = {
            type: "text",
            x: sceneX + 16,
            y: sceneY + 16,
            width: cardWidth - 32,
            height: 24,
            angle: 0,
            strokeColor: "#000000",
            backgroundColor: "transparent",
            fillStyle: "solid",
            strokeWidth: 1,
            strokeStyle: "solid",
            roughness: 0,
            opacity: 100,
            groupIds: [groupId],
            seed: Math.random(),
            version: 1,
            versionNonce: 0,
            isDeleted: false,
            boundElements: null,
            updated: Date.now(),
            text: item.label ? (item.label.length > 25 ? item.label.substring(0, 24) + "..." : item.label) : "Untitled Link",
            originalText: item.label || "Untitled Link",
            fontSize: 16,
            fontFamily: 1, 
            textAlign: "left",
            verticalAlign: "top",
            baseline: 14,
            id: `card-label-${Date.now()}-${Math.random()}`,
           };

           const linkText = {
             type: "text",
             x: sceneX + 16,
             y: sceneY + 44,
             width: cardWidth - 32,
             height: 16,
             angle: 0,
             strokeColor: "#374151",
             backgroundColor: "transparent",
             fillStyle: "solid",
             strokeWidth: 1,
             strokeStyle: "solid",
             roughness: 0,
             opacity: 100,
             groupIds: [groupId],
             seed: Math.random(),
             version: 1,
             versionNonce: 0,
             isDeleted: false,
             boundElements: null,
             updated: Date.now(),
             text: item.url ? (item.url.length > 30 ? item.url.substring(0, 29) + "..." : item.url) : "",
             originalText: item.url || "",
             fontSize: 12,
             fontFamily: 1,
             textAlign: "left",
             verticalAlign: "top",
             baseline: 10,
             link: item.url, 
             id: `card-link-${Date.now()}-${Math.random()}`,
           };
           
           newElements = [cardBg, labelText, linkText];

           // Render userIntent if available
           if (item.userIntent) {
               const intentText = {
                 type: "text",
                 x: sceneX + 16,
                 y: sceneY + 68,
                 width: cardWidth - 32,
                 height: 60,
                 angle: 0,
                 strokeColor: "#64748b",
                 backgroundColor: "transparent",
                 fillStyle: "solid",
                 strokeWidth: 1,
                 strokeStyle: "solid",
                 roughness: 0,
                 opacity: 100,
                 groupIds: [groupId],
                 seed: Math.random(),
                 version: 1,
                 versionNonce: 0,
                 isDeleted: false,
                 boundElements: null,
                 updated: Date.now(),
                 text: item.userIntent.length > 60 ? item.userIntent.substring(0, 57) + "..." : item.userIntent,
                 originalText: item.userIntent,
                 fontSize: 12,
                 fontFamily: 1,
                 textAlign: "left",
                 verticalAlign: "top",
                 baseline: 10,
                 id: `card-intent-${Date.now()}-${Math.random()}`,
               };
               newElements.push(intentText);
           }

      } else if (item.content || item.text) {
           const textEl = {
            type: "text",
            x: sceneX,
            y: sceneY,
            width: 200,
            height: 20,
            angle: 0,
            strokeColor: "#000000",
            backgroundColor: "transparent",
            fillStyle: "hachure",
            strokeWidth: 1,
            strokeStyle: "solid",
            roughness: 1,
            opacity: 100,
            groupIds: [],
            text: item.content || item.text,
            originalText: item.content || item.text,
            fontSize: 20,
            fontFamily: 1,
            textAlign: "left",
            verticalAlign: "top",
            baseline: 18,
            id: `text-${Date.now()}-${Math.random()}`,
           };
           newElements = [textEl];
      }

      if (newElements.length > 0) {
        excalidrawAPI.updateScene({
          elements: [...elements, ...newElements],
        });
        saveElements(false);
        toast.success("Item added to whiteboard");
      }
    } catch (err) {
      console.error("Failed to parse drop data", err);
    }
  };

  const handleCanvasClick = () => {
    if (!selectedTool || !excalidrawAPI) return;

    if (!canEdit) {
      toast.error("You don't have permission to edit this space");
      setSelectedTool(null);
      return;
    }

    const appState = excalidrawAPI.getAppState();
    const elements = excalidrawAPI.getSceneElements();

    const sceneX = (appState.width / 2 - (appState.offsetLeft || 0)) / appState.zoom.value - appState.scrollX;
    const sceneY = (appState.height / 2 - (appState.offsetTop || 0)) / appState.zoom.value - appState.scrollY;

    const textElement = {
      type: "text",
      x: sceneX,
      y: sceneY,
      width: 200,
      height: 60,
      angle: 0,
      strokeColor: "#1e1e1e",
      backgroundColor: "transparent",
      fillStyle: "hachure",
      strokeWidth: 1,
      strokeStyle: "solid",
      roughness: 1,
      opacity: 100,
      groupIds: [],
      frameId: null,
      roundness: null,
      seed: Math.random(),
      version: 1,
      versionNonce: 0,
      isDeleted: false,
      boundElements: null,
      updated: Date.now(),
      link: selectedTool.url,
      text: selectedTool.label,
      fontSize: 16,
      fontFamily: 1,
      textAlign: "left",
      verticalAlign: "top",
      baseline: 18,
      containerId: null,
      originalText: selectedTool.label,
      id: `link-${Date.now()}-${Math.random()}`,
    };

    excalidrawAPI.updateScene({
      elements: [...elements, textElement],
    });

    setSelectedTool(null);
    saveElements(false);
    toast.success("Knowledge item added to whiteboard");
  };

  return (
    <div 
      className="h-[calc(100vh-120px)] w-full border rounded-lg overflow-hidden bg-background relative"
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      onClickCapture={handleCanvasClick}
    >
      {!currentSpace ? (
        <div className="flex h-full items-center justify-center text-muted-foreground flex-col gap-4">
           <div className="text-center p-4">
             <p>Select a space from the header or create a new one.</p>
           </div>
        </div>
      ) : (
        <>
            {selectedTool && canEdit && (
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground px-4 py-2 rounded shadow-lg z-50 pointer-events-none">
                Click to place: {selectedTool.label}
                </div>
            )}
            
            <Excalidraw
                excalidrawAPI={(api) => setExcalidrawAPI(api)}
                onChange={handleChange}
                initialData={{
                    appState: {
                        viewBackgroundColor: "#ffffff",
                        currentItemFontFamily: 1,
                    }
                }}
                viewModeEnabled={!canEdit}
            />
            
            {selectedCard && canEdit && (
              <div 
                className="absolute flex gap-2 bg-white dark:bg-zinc-800 p-2 rounded-md shadow-xl border z-50 animate-in fade-in zoom-in duration-200"
                style={{ 
                    left: selectedCard.x, 
                    top: selectedCard.y,
                    transform: 'translateY(-100%)' 
                }}
              >
                 <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-muted-foreground px-1">Knowledge Item</span>
                    <div className="h-4 w-px bg-border mx-1" />
                    <button 
                       onClick={() => toast.info("Edit feature coming soon")} 
                       className="p-1.5 hover:bg-muted rounded-md transition-colors text-foreground"
                       title="Edit Item"
                    >
                        <Edit className="w-4 h-4" />
                    </button>
                    <button 
                       onClick={handleDeleteCard} 
                       className="p-1.5 hover:bg-destructive/10 text-destructive rounded-md transition-colors"
                       title="Delete Permanently"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                 </div>
              </div>
            )}
            
            <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Remove from whiteboard</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to remove this item from the whiteboard? This will not delete the item from your library.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={executeDeleteCard}>Remove</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
      )}
    </div>
  );
}