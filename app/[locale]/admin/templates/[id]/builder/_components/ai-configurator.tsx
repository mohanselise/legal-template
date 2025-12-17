"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Send,
  X,
  Loader2,
  Sparkles,
  Check,
  Plus,
  FileText,
  AlertCircle,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Wand2,
  Users,
  Zap,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import type { TemplateScreen, TemplateField } from "@/lib/db";

// Types for the AI configurator
interface ScreenWithFields extends TemplateScreen {
  fields: TemplateField[];
}

// Condition types for conditional visibility
interface ConditionRule {
  field: string;
  operator: string;
  value?: unknown;
}

interface ConditionGroup {
  operator: "and" | "or";
  rules: ConditionRule[];
}

interface FieldData {
  name: string;
  label: string;
  type: "text" | "email" | "date" | "number" | "checkbox" | "select" | "multiselect" | "textarea" | "phone" | "address" | "party" | "currency" | "percentage" | "url";
  required: boolean;
  placeholder?: string;
  helpText?: string;
  options?: string[];
  aiSuggestionEnabled?: boolean;
  aiSuggestionKey?: string;
  conditions?: ConditionGroup; // Conditional visibility
}

interface AIEnrichment {
  prompt: string;
  outputSchema: {
    type: "object";
    properties: Record<string, { type: string; description?: string }>;
    required?: string[];
  };
}

interface PartyTypeConfig {
  value: string;
  label: string;
  description?: string;
}

interface SignatoryConfig {
  mode: "deterministic" | "dynamic";
  partyTypes: PartyTypeConfig[];
  minSignatories: number;
  maxSignatories: number;
  collectFields: {
    name: boolean;
    email: boolean;
    title: boolean;
    phone: boolean;
    company: boolean;
    address?: boolean;
  };
  predefinedSignatories?: Array<{
    id: string;
    partyType: string;
    label: string;
    required: boolean;
    order: number;
  }>;
}

interface ScreenData {
  title: string;
  description?: string;
  type?: "standard" | "signatory" | "dynamic";
  // Conditional visibility - show/hide screen based on previous form responses
  conditions?: ConditionGroup;
  // For standard screens
  fields?: FieldData[];
  aiEnrichment?: AIEnrichment;
  enableApplyStandards?: boolean; // One-click auto-fill for AI suggestions
  // For signatory screens
  signatoryConfig?: SignatoryConfig;
  // For dynamic screens
  dynamicPrompt?: string;
  dynamicMaxFields?: number;
}

interface UpdateScreenData extends ScreenData {
  screenId: string; // ID of the screen to update
}

interface RemoveScreenData {
  screenId: string;
}

interface ReorderScreensData {
  screenOrder: string[]; // Array of screen IDs in new order
}

interface AIAction {
  type: "createScreen" | "updateScreen" | "addFields" | "removeScreen" | "reorderScreens";
  data: ScreenData | UpdateScreenData | FieldData | FieldData[] | RemoveScreenData | ReorderScreensData;
  applied?: boolean;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  actions?: AIAction[];
  suggestions?: string[];
  timestamp: Date;
  isError?: boolean;
  autoNext?: boolean;
}

interface AIConfiguratorProps {
  templateId: string;
  templateTitle: string;
  templateDescription: string;
  screens: ScreenWithFields[];
  selectedScreen: ScreenWithFields | null;
  onScreenCreated: () => void;
  onFieldsUpdated: () => void;
  onClose: () => void;
}

// Generate unique ID for messages
function generateId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export function AIConfigurator({
  templateId,
  templateTitle,
  templateDescription,
  screens,
  selectedScreen,
  onScreenCreated,
  onFieldsUpdated,
  onClose,
}: AIConfiguratorProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAutoApplying, setIsAutoApplying] = useState(false);
  const [contextExpanded, setContextExpanded] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const autoNextRef = useRef<boolean>(false);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const sendMessage = useCallback(async (overrideMessage?: string) => {
    const messageText = overrideMessage ?? input;
    if (!messageText.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: generateId(),
      role: "user",
      content: messageText.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai/template-configurator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          templateContext: {
            templateId,
            templateTitle,
            templateDescription,
            screens: screens.map((s) => ({
              id: s.id,
              title: s.title,
              description: s.description,
              order: s.order,
              type: s.type || "standard",
              enableApplyStandards: s.enableApplyStandards || false,
              aiPrompt: s.aiPrompt,
              aiOutputSchema: s.aiOutputSchema,
              signatoryConfig: s.signatoryConfig,
              dynamicPrompt: s.dynamicPrompt,
              dynamicMaxFields: s.dynamicMaxFields,
              conditions: s.conditions, // Include screen conditions
              fields: s.fields.map((f) => ({
                name: f.name,
                label: f.label,
                type: f.type,
                required: f.required,
                placeholder: f.placeholder,
                helpText: f.helpText,
                options: f.options,
                aiSuggestionEnabled: f.aiSuggestionEnabled || false,
                aiSuggestionKey: f.aiSuggestionKey,
                conditions: f.conditions, // Include field conditions
              })),
            })),
          },
          selectedScreenId: selectedScreen?.id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get AI response");
      }

      const data = await response.json();

      const assistantMessage: ChatMessage = {
        id: generateId(),
        role: "assistant",
        content: data.message,
        actions: data.actions,
        suggestions: data.suggestions,
        timestamp: new Date(),
        autoNext: data.autoNext,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Handle auto-apply and auto-continue
      if (data.autoNext && data.actions && data.actions.length > 0) {
        autoNextRef.current = true;
        setIsAutoApplying(true);
        
        // Auto-apply all actions sequentially
        for (let i = 0; i < data.actions.length; i++) {
          const action = data.actions[i];
          try {
            await applyActionDirect(action);
            // Mark action as applied in the message
            setMessages((prev) =>
              prev.map((msg) => {
                if (msg.id === assistantMessage.id && msg.actions) {
                  const updatedActions = [...msg.actions];
                  updatedActions[i] = { ...action, applied: true };
                  return { ...msg, actions: updatedActions };
                }
                return msg;
              })
            );
          } catch (err) {
            console.error("Auto-apply failed:", err);
            toast.error("Failed to auto-apply action");
            setIsAutoApplying(false);
            autoNextRef.current = false;
            return;
          }
        }
        
        setIsAutoApplying(false);
        
        // Trigger screen refresh
        onScreenCreated();
        
        // Small delay to let the UI update, then auto-continue
        setTimeout(() => {
          if (autoNextRef.current) {
            autoNextRef.current = false;
            sendContinuation();
          }
        }, 500);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: ChatMessage = {
        id: generateId(),
        role: "assistant",
        content: "Sorry, I encountered an error processing your request. Please try again.",
        timestamp: new Date(),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
      toast.error("Failed to get AI response");
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages, templateId, templateTitle, templateDescription, screens, selectedScreen]);

  // Helper function to apply action directly (for auto-apply)
  const applyActionDirect = useCallback(async (action: AIAction) => {
    if (action.type === "createScreen") {
      const screenData = action.data as ScreenData;
      const screenType = screenData.type || "standard";
      
      const screenPayload: Record<string, unknown> = {
        title: screenData.title,
        description: screenData.description || "",
        type: screenType,
      };

      if (screenData.enableApplyStandards !== undefined) {
        screenPayload.enableApplyStandards = screenData.enableApplyStandards;
      }

      if (screenData.conditions && screenData.conditions.rules?.length > 0) {
        screenPayload.conditions = JSON.stringify(screenData.conditions);
      }

      if (screenType === "signatory" && screenData.signatoryConfig) {
        screenPayload.signatoryConfig = JSON.stringify(screenData.signatoryConfig);
      }
      if (screenType === "dynamic") {
        if (screenData.dynamicPrompt) {
          screenPayload.dynamicPrompt = screenData.dynamicPrompt;
        }
        if (screenData.dynamicMaxFields) {
          screenPayload.dynamicMaxFields = screenData.dynamicMaxFields;
        }
      }

      const screenResponse = await fetch(`/api/admin/templates/${templateId}/screens`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(screenPayload),
      });

      if (!screenResponse.ok) {
        throw new Error("Failed to create screen");
      }

      const newScreen = await screenResponse.json();

      if (screenType === "standard" && screenData.fields && screenData.fields.length > 0) {
        for (const field of screenData.fields) {
          const fieldPayload: Record<string, unknown> = {
            name: field.name,
            label: field.label,
            type: field.type,
            required: field.required,
            placeholder: field.placeholder || "",
            helpText: field.helpText || "",
            options: field.options || [],
            aiSuggestionEnabled: field.aiSuggestionEnabled || false,
          };
          
          if (field.aiSuggestionEnabled && field.aiSuggestionKey) {
            fieldPayload.aiSuggestionKey = field.aiSuggestionKey;
          }
          
          if (field.conditions && field.conditions.rules?.length > 0) {
            fieldPayload.conditions = JSON.stringify(field.conditions);
          }
          
          await fetch(`/api/admin/screens/${newScreen.id}/fields`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(fieldPayload),
          });
        }
      }

      if (screenData.aiEnrichment) {
        await fetch(`/api/admin/templates/${templateId}/screens/${newScreen.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            aiPrompt: screenData.aiEnrichment.prompt,
            aiOutputSchema: JSON.stringify(screenData.aiEnrichment.outputSchema),
          }),
        });
      }

      let successMsg = `Screen "${screenData.title}" created`;
      if (screenType === "standard") {
        successMsg += ` with ${screenData.fields?.length || 0} fields`;
      } else if (screenType === "signatory") {
        successMsg += " (signatory collection)";
      } else if (screenType === "dynamic") {
        successMsg += " (AI-generated fields)";
      }
      toast.success(successMsg);
    } else if (action.type === "updateScreen") {
      // Handle updateScreen for editing existing templates
      const updateData = action.data as UpdateScreenData;
      
      if (!updateData.screenId) {
        throw new Error("Missing screen ID for update");
      }

      // Update screen properties
      const screenUpdatePayload: Record<string, unknown> = {};
      
      if (updateData.title) screenUpdatePayload.title = updateData.title;
      if (updateData.description !== undefined) screenUpdatePayload.description = updateData.description;
      if (updateData.enableApplyStandards !== undefined) {
        screenUpdatePayload.enableApplyStandards = updateData.enableApplyStandards;
      }
      if (updateData.conditions !== undefined) {
        screenUpdatePayload.conditions = updateData.conditions && updateData.conditions.rules?.length > 0
          ? JSON.stringify(updateData.conditions)
          : null;
      }
      if (updateData.aiEnrichment) {
        screenUpdatePayload.aiPrompt = updateData.aiEnrichment.prompt;
        screenUpdatePayload.aiOutputSchema = JSON.stringify(updateData.aiEnrichment.outputSchema);
      }
      if (updateData.type === "signatory" && updateData.signatoryConfig) {
        screenUpdatePayload.signatoryConfig = JSON.stringify(updateData.signatoryConfig);
      }
      if (updateData.type === "dynamic") {
        if (updateData.dynamicPrompt) screenUpdatePayload.dynamicPrompt = updateData.dynamicPrompt;
        if (updateData.dynamicMaxFields) screenUpdatePayload.dynamicMaxFields = updateData.dynamicMaxFields;
      }

      if (Object.keys(screenUpdatePayload).length > 0) {
        const updateResponse = await fetch(
          `/api/admin/templates/${templateId}/screens/${updateData.screenId}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(screenUpdatePayload),
          }
        );
        
        if (!updateResponse.ok) {
          throw new Error("Failed to update screen");
        }
      }

      // If fields are provided, update them (delete existing and re-create)
      if (updateData.fields && updateData.fields.length > 0) {
        const existingScreen = screens.find(s => s.id === updateData.screenId);
        if (existingScreen) {
          for (const field of existingScreen.fields) {
            await fetch(`/api/admin/fields/${field.id}`, {
              method: "DELETE",
            });
          }
        }
        
        for (const field of updateData.fields) {
          const fieldPayload: Record<string, unknown> = {
            name: field.name,
            label: field.label,
            type: field.type,
            required: field.required,
            placeholder: field.placeholder || "",
            helpText: field.helpText || "",
            options: field.options || [],
            aiSuggestionEnabled: field.aiSuggestionEnabled || false,
          };
          
          if (field.aiSuggestionEnabled && field.aiSuggestionKey) {
            fieldPayload.aiSuggestionKey = field.aiSuggestionKey;
          }
          
          if (field.conditions && field.conditions.rules?.length > 0) {
            fieldPayload.conditions = JSON.stringify(field.conditions);
          }
          
          await fetch(`/api/admin/screens/${updateData.screenId}/fields`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(fieldPayload),
          });
        }
      }

      const screenName = screens.find(s => s.id === updateData.screenId)?.title || "Screen";
      toast.success(`Updated "${screenName}"`);
    }
  }, [templateId, screens]);

  // Send continuation message to get the next screen
  const sendContinuation = useCallback(async () => {
    setIsLoading(true);

    try {
      // Fetch the latest screens from the API to ensure we have current data
      const screensResponse = await fetch(`/api/admin/templates/${templateId}/screens`);
      if (!screensResponse.ok) {
        throw new Error("Failed to fetch latest screens");
      }
      const latestScreens = await screensResponse.json();
      
      if (process.env.NODE_ENV === "development") {
        console.log("[AI_CONFIGURATOR] Fetched latest screens for continuation:", latestScreens.length);
      }
      
      // Get latest messages including the assistant's last message
      const currentMessages = [...messages];
      
      // Add a system continuation message
      const continuationMessage: ChatMessage = {
        id: generateId(),
        role: "user",
        content: "Continue with the next screen.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, continuationMessage]);

      const response = await fetch("/api/ai/template-configurator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...currentMessages, continuationMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          templateContext: {
            templateId,
            templateTitle,
            templateDescription,
            screens: latestScreens.map((s: ScreenWithFields) => ({
              id: s.id,
              title: s.title,
              description: s.description,
              order: s.order,
              type: s.type || "standard",
              enableApplyStandards: s.enableApplyStandards || false,
              aiPrompt: s.aiPrompt,
              aiOutputSchema: s.aiOutputSchema,
              signatoryConfig: s.signatoryConfig,
              dynamicPrompt: s.dynamicPrompt,
              dynamicMaxFields: s.dynamicMaxFields,
              conditions: s.conditions,
              fields: s.fields.map((f: TemplateField) => ({
                name: f.name,
                label: f.label,
                type: f.type,
                required: f.required,
                placeholder: f.placeholder,
                helpText: f.helpText,
                options: f.options,
                aiSuggestionEnabled: f.aiSuggestionEnabled || false,
                aiSuggestionKey: f.aiSuggestionKey,
                conditions: f.conditions,
              })),
            })),
          },
          selectedScreenId: selectedScreen?.id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get AI response");
      }

      const data = await response.json();

      const assistantMessage: ChatMessage = {
        id: generateId(),
        role: "assistant",
        content: data.message,
        actions: data.actions,
        suggestions: data.suggestions,
        timestamp: new Date(),
        autoNext: data.autoNext,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Handle auto-apply and auto-continue for the continuation
      if (data.autoNext && data.actions && data.actions.length > 0) {
        autoNextRef.current = true;
        setIsAutoApplying(true);
        
        for (let i = 0; i < data.actions.length; i++) {
          const action = data.actions[i];
          try {
            await applyActionDirect(action);
            setMessages((prev) =>
              prev.map((msg) => {
                if (msg.id === assistantMessage.id && msg.actions) {
                  const updatedActions = [...msg.actions];
                  updatedActions[i] = { ...action, applied: true };
                  return { ...msg, actions: updatedActions };
                }
                return msg;
              })
            );
          } catch (err) {
            console.error("Auto-apply failed:", err);
            toast.error("Failed to auto-apply action");
            setIsAutoApplying(false);
            autoNextRef.current = false;
            return;
          }
        }
        
        setIsAutoApplying(false);
        onScreenCreated();
        
        setTimeout(() => {
          if (autoNextRef.current) {
            autoNextRef.current = false;
            sendContinuation();
          }
        }, 500);
      }
    } catch (error) {
      console.error("Error in continuation:", error);
      toast.error("Failed to continue template creation");
    } finally {
      setIsLoading(false);
    }
  }, [messages, templateId, templateTitle, templateDescription, selectedScreen, applyActionDirect, onScreenCreated]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    // Auto-send immediately when clicking a suggestion
    sendMessage(suggestion);
  };

  const applyAction = async (messageId: string, actionIndex: number, action: AIAction) => {
    try {
      if (action.type === "createScreen") {
        const screenData = action.data as ScreenData;
        const screenType = screenData.type || "standard";
        
        // Build the screen creation payload based on type
        const screenPayload: Record<string, unknown> = {
          title: screenData.title,
          description: screenData.description || "",
          type: screenType,
        };

        // Add enableApplyStandards if specified
        if (screenData.enableApplyStandards !== undefined) {
          screenPayload.enableApplyStandards = screenData.enableApplyStandards;
        }

        // Add conditions for conditional screen visibility
        if (screenData.conditions && screenData.conditions.rules?.length > 0) {
          screenPayload.conditions = JSON.stringify(screenData.conditions);
        }

        // Add type-specific configuration
        if (screenType === "signatory" && screenData.signatoryConfig) {
          screenPayload.signatoryConfig = JSON.stringify(screenData.signatoryConfig);
        }
        if (screenType === "dynamic") {
          if (screenData.dynamicPrompt) {
            screenPayload.dynamicPrompt = screenData.dynamicPrompt;
          }
          if (screenData.dynamicMaxFields) {
            screenPayload.dynamicMaxFields = screenData.dynamicMaxFields;
          }
        }

        // Create the screen
        const screenResponse = await fetch(`/api/admin/templates/${templateId}/screens`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(screenPayload),
        });

        if (!screenResponse.ok) {
          throw new Error("Failed to create screen");
        }

        const newScreen = await screenResponse.json();

        // Add fields to standard screens
        if (screenType === "standard" && screenData.fields && screenData.fields.length > 0) {
          for (const field of screenData.fields) {
            const fieldPayload: Record<string, unknown> = {
              name: field.name,
              label: field.label,
              type: field.type,
              required: field.required,
              placeholder: field.placeholder || "",
              helpText: field.helpText || "",
              options: field.options || [],
              aiSuggestionEnabled: field.aiSuggestionEnabled || false,
            };
            
            // Only include aiSuggestionKey if enabled and has a value
            if (field.aiSuggestionEnabled && field.aiSuggestionKey) {
              fieldPayload.aiSuggestionKey = field.aiSuggestionKey;
            }
            
            // Add conditions for conditional field visibility
            if (field.conditions && field.conditions.rules?.length > 0) {
              fieldPayload.conditions = JSON.stringify(field.conditions);
            }
            
            await fetch(`/api/admin/screens/${newScreen.id}/fields`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(fieldPayload),
            });
          }
        }

        // Save AI enrichment if provided (works for all screen types)
        if (screenData.aiEnrichment) {
          await fetch(`/api/admin/templates/${templateId}/screens/${newScreen.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              aiPrompt: screenData.aiEnrichment.prompt,
              aiOutputSchema: JSON.stringify(screenData.aiEnrichment.outputSchema),
            }),
          });
        }

        // Mark action as applied
        setMessages((prev) =>
          prev.map((msg) => {
            if (msg.id === messageId && msg.actions) {
              const updatedActions = [...msg.actions];
              updatedActions[actionIndex] = { ...action, applied: true };
              return { ...msg, actions: updatedActions };
            }
            return msg;
          })
        );

        // Build success message based on screen type
        let successMsg = `Screen "${screenData.title}" created`;
        if (screenType === "standard") {
          successMsg += ` with ${screenData.fields?.length || 0} fields`;
        } else if (screenType === "signatory") {
          successMsg += " (signatory collection)";
        } else if (screenType === "dynamic") {
          successMsg += " (AI-generated fields)";
        }
        if (screenData.aiEnrichment) {
          successMsg += " + AI enrichment";
        }
        toast.success(successMsg);
        onScreenCreated();
      } else if (action.type === "addFields") {
        if (!selectedScreen) {
          toast.error("Please select a screen to add fields to");
          return;
        }

        const fieldsData = action.data as FieldData[];
        
        for (const field of fieldsData) {
          const fieldPayload: Record<string, unknown> = {
            name: field.name,
            label: field.label,
            type: field.type,
            required: field.required,
            placeholder: field.placeholder || "",
            helpText: field.helpText || "",
            options: field.options || [],
            aiSuggestionEnabled: field.aiSuggestionEnabled || false,
          };
          
          // Only include aiSuggestionKey if enabled and has a value
          if (field.aiSuggestionEnabled && field.aiSuggestionKey) {
            fieldPayload.aiSuggestionKey = field.aiSuggestionKey;
          }
          
          // Add conditions for conditional field visibility
          if (field.conditions && field.conditions.rules?.length > 0) {
            fieldPayload.conditions = JSON.stringify(field.conditions);
          }
          
          await fetch(`/api/admin/screens/${selectedScreen.id}/fields`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(fieldPayload),
          });
        }

        // Mark action as applied
        setMessages((prev) =>
          prev.map((msg) => {
            if (msg.id === messageId && msg.actions) {
              const updatedActions = [...msg.actions];
              updatedActions[actionIndex] = { ...action, applied: true };
              return { ...msg, actions: updatedActions };
            }
            return msg;
          })
        );

        toast.success(`Added ${fieldsData.length} field(s) to "${selectedScreen.title}"`);
        onFieldsUpdated();
      } else if (action.type === "updateScreen") {
        const updateData = action.data as UpdateScreenData;
        
        if (!updateData.screenId) {
          toast.error("Missing screen ID for update");
          return;
        }

        // First, update screen properties
        const screenUpdatePayload: Record<string, unknown> = {};
        
        if (updateData.title) screenUpdatePayload.title = updateData.title;
        if (updateData.description !== undefined) screenUpdatePayload.description = updateData.description;
        if (updateData.enableApplyStandards !== undefined) {
          screenUpdatePayload.enableApplyStandards = updateData.enableApplyStandards;
        }
        // Add/update conditions for conditional screen visibility
        if (updateData.conditions !== undefined) {
          screenUpdatePayload.conditions = updateData.conditions && updateData.conditions.rules?.length > 0
            ? JSON.stringify(updateData.conditions)
            : null; // Clear conditions if empty
        }
        if (updateData.aiEnrichment) {
          screenUpdatePayload.aiPrompt = updateData.aiEnrichment.prompt;
          screenUpdatePayload.aiOutputSchema = JSON.stringify(updateData.aiEnrichment.outputSchema);
        }
        if (updateData.type === "signatory" && updateData.signatoryConfig) {
          screenUpdatePayload.signatoryConfig = JSON.stringify(updateData.signatoryConfig);
        }
        if (updateData.type === "dynamic") {
          if (updateData.dynamicPrompt) screenUpdatePayload.dynamicPrompt = updateData.dynamicPrompt;
          if (updateData.dynamicMaxFields) screenUpdatePayload.dynamicMaxFields = updateData.dynamicMaxFields;
        }

        // Update screen properties
        if (Object.keys(screenUpdatePayload).length > 0) {
          const updateResponse = await fetch(
            `/api/admin/templates/${templateId}/screens/${updateData.screenId}`,
            {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(screenUpdatePayload),
            }
          );
          
          if (!updateResponse.ok) {
            throw new Error("Failed to update screen");
          }
        }

        // If fields are provided, update them (delete existing and re-create)
        if (updateData.fields && updateData.fields.length > 0) {
          // Get existing fields to delete
          const existingScreen = screens.find(s => s.id === updateData.screenId);
          if (existingScreen) {
            // Delete existing fields
            for (const field of existingScreen.fields) {
              await fetch(`/api/admin/fields/${field.id}`, {
                method: "DELETE",
              });
            }
          }
          
          // Create new fields
          for (const field of updateData.fields) {
            const fieldPayload: Record<string, unknown> = {
              name: field.name,
              label: field.label,
              type: field.type,
              required: field.required,
              placeholder: field.placeholder || "",
              helpText: field.helpText || "",
              options: field.options || [],
              aiSuggestionEnabled: field.aiSuggestionEnabled || false,
            };
            
            if (field.aiSuggestionEnabled && field.aiSuggestionKey) {
              fieldPayload.aiSuggestionKey = field.aiSuggestionKey;
            }
            
            // Add conditions for conditional field visibility
            if (field.conditions && field.conditions.rules?.length > 0) {
              fieldPayload.conditions = JSON.stringify(field.conditions);
            }
            
            await fetch(`/api/admin/screens/${updateData.screenId}/fields`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(fieldPayload),
            });
          }
        }

        // Mark action as applied
        setMessages((prev) =>
          prev.map((msg) => {
            if (msg.id === messageId && msg.actions) {
              const updatedActions = [...msg.actions];
              updatedActions[actionIndex] = { ...action, applied: true };
              return { ...msg, actions: updatedActions };
            }
            return msg;
          })
        );

        const screenName = screens.find(s => s.id === updateData.screenId)?.title || "Screen";
        toast.success(`Updated "${screenName}" with AI improvements`);
        onScreenCreated(); // Refresh screens
      } else if (action.type === "removeScreen") {
        const removeData = action.data as RemoveScreenData;
        
        if (!removeData.screenId) {
          toast.error("Missing screen ID for removal");
          return;
        }

        const screenName = screens.find(s => s.id === removeData.screenId)?.title || "Screen";
        
        const deleteResponse = await fetch(
          `/api/admin/templates/${templateId}/screens/${removeData.screenId}`,
          { method: "DELETE" }
        );
        
        if (!deleteResponse.ok) {
          throw new Error("Failed to delete screen");
        }

        // Mark action as applied
        setMessages((prev) =>
          prev.map((msg) => {
            if (msg.id === messageId && msg.actions) {
              const updatedActions = [...msg.actions];
              updatedActions[actionIndex] = { ...action, applied: true };
              return { ...msg, actions: updatedActions };
            }
            return msg;
          })
        );

        toast.success(`Removed screen "${screenName}"`);
        onScreenCreated(); // Refresh screens
      } else if (action.type === "reorderScreens") {
        const reorderData = action.data as ReorderScreensData;
        
        if (!reorderData.screenOrder || !Array.isArray(reorderData.screenOrder)) {
          toast.error("Invalid screen order data");
          return;
        }

        // Update order for each screen
        for (let i = 0; i < reorderData.screenOrder.length; i++) {
          const screenId = reorderData.screenOrder[i];
          await fetch(`/api/admin/templates/${templateId}/screens/${screenId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ order: i }),
          });
        }

        // Mark action as applied
        setMessages((prev) =>
          prev.map((msg) => {
            if (msg.id === messageId && msg.actions) {
              const updatedActions = [...msg.actions];
              updatedActions[actionIndex] = { ...action, applied: true };
              return { ...msg, actions: updatedActions };
            }
            return msg;
          })
        );

        toast.success("Screens reordered successfully");
        onScreenCreated(); // Refresh screens
      }
    } catch (error) {
      console.error("Error applying action:", error);
      toast.error("Failed to apply changes");
    }
  };

  const clearChat = () => {
    setMessages([]);
    setInput("");
  };

  return (
    <Card className="border-[hsl(var(--border))] h-full flex flex-col sticky top-4">
      <CardHeader className="pb-3 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-[hsl(var(--selise-blue))]/10 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-[hsl(var(--selise-blue))]" />
            </div>
            <div>
              <CardTitle className="text-base">AI Configurator</CardTitle>
              <CardDescription className="text-xs">
                Build screens with natural language
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={clearChat}
                title="Clear chat"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {/* Context Panel */}
      <div className="px-4 pb-2 shrink-0">
        <button
          type="button"
          onClick={() => setContextExpanded(!contextExpanded)}
          className="flex items-center gap-2 w-full text-left hover:opacity-70 transition-opacity"
        >
          {contextExpanded ? (
            <ChevronUp className="h-3 w-3 text-[hsl(var(--globe-grey))]" />
          ) : (
            <ChevronDown className="h-3 w-3 text-[hsl(var(--globe-grey))]" />
          )}
          <span className="text-xs font-medium text-[hsl(var(--globe-grey))] uppercase tracking-wider">
            Context
          </span>
        </button>
        {contextExpanded && (
          <div className="mt-2 p-3 bg-[hsl(var(--muted))]/30 rounded-lg border border-[hsl(var(--border))]">
            <div className="space-y-2 text-xs">
              <div>
                <span className="text-[hsl(var(--globe-grey))]">Template: </span>
                <span className="font-medium text-[hsl(var(--fg))]">{templateTitle}</span>
              </div>
              <div>
                <span className="text-[hsl(var(--globe-grey))]">Screens: </span>
                <span className="font-medium text-[hsl(var(--fg))]">{screens.length}</span>
              </div>
              {selectedScreen && (
                <div>
                  <span className="text-[hsl(var(--globe-grey))]">Selected: </span>
                  <Badge variant="secondary" className="text-xs py-0">
                    {selectedScreen.title}
                  </Badge>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Messages Area */}
      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <div className="h-16 w-16 rounded-2xl bg-[hsl(var(--selise-blue))]/10 flex items-center justify-center mb-4">
              <Sparkles className="h-8 w-8 text-[hsl(var(--selise-blue))]" />
            </div>
            <h3 className="font-semibold text-[hsl(var(--fg))] mb-2">
              Let&apos;s build your template
            </h3>
            <p className="text-sm text-[hsl(var(--globe-grey))] mb-4 max-w-[280px]">
              Tell me what kind of template you&apos;re creating. I&apos;ll ask a few questions, then propose the complete structure with all screens.
            </p>
            <div className="space-y-2 w-full">
              <p className="text-xs text-[hsl(var(--globe-grey))] uppercase tracking-wider">
                Get started:
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {[
                  "I need an employment agreement",
                  "Help me create an NDA template",
                  "Build a service agreement",
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    className="text-xs px-3 py-1.5 rounded-full border border-[hsl(var(--border))] hover:bg-[hsl(var(--selise-blue))]/5 hover:border-[hsl(var(--selise-blue))]/20 transition-colors text-[hsl(var(--fg))]"
                    onClick={() => {
                      setInput(suggestion);
                      inputRef.current?.focus();
                    }}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message, messageIndex) => (
              <div key={message.id} className="space-y-2">
                <div
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[90%] rounded-2xl px-4 py-3 ${
                      message.role === "user"
                        ? "bg-[hsl(var(--selise-blue))] text-white"
                        : message.isError
                        ? "bg-[hsl(var(--destructive))]/10 text-[hsl(var(--destructive))]"
                        : "bg-[hsl(var(--muted))] text-[hsl(var(--fg))]"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    
                    {/* Actions */}
                    {message.actions && message.actions.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {message.actions.map((action, idx) => (
                          <ActionCard
                            key={idx}
                            action={action}
                            onApply={() => applyAction(message.id, idx, action)}
                            selectedScreen={selectedScreen}
                          />
                        ))}
                      </div>
                    )}
                    
                    <p className="text-[10px] opacity-60 mt-2">
                      {message.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
                
                {/* Quick Reply Suggestions - show only on last assistant message */}
                {message.role === "assistant" && 
                 message.suggestions && 
                 message.suggestions.length > 0 && 
                 messageIndex === messages.length - 1 &&
                 !isLoading && (
                  <div className="flex flex-wrap gap-2 pl-2">
                    {message.suggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="text-xs px-3 py-1.5 rounded-full border border-[hsl(var(--selise-blue))]/30 bg-[hsl(var(--selise-blue))]/5 hover:bg-[hsl(var(--selise-blue))]/10 hover:border-[hsl(var(--selise-blue))]/50 transition-colors text-[hsl(var(--selise-blue))] font-medium"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {(isLoading || isAutoApplying) && (
              <div className="flex justify-start">
                <div className="bg-[hsl(var(--muted))] rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-[hsl(var(--selise-blue))]" />
                    <span className="text-sm text-[hsl(var(--globe-grey))]">
                      {isAutoApplying ? "Building screen..." : "Thinking..."}
                    </span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </CardContent>

      {/* Input Area */}
      <div className="p-4 border-t border-[hsl(var(--border))] shrink-0">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe the screen or fields you need..."
            className="flex-1 resize-none rounded-xl border border-[hsl(var(--input))] bg-transparent px-4 py-3 text-sm placeholder:text-[hsl(var(--globe-grey))] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[hsl(var(--ring))] disabled:cursor-not-allowed disabled:opacity-50 min-h-[48px] max-h-[120px]"
            rows={1}
            disabled={isLoading}
          />
          <Button
            onClick={() => sendMessage()}
            disabled={!input.trim() || isLoading}
            size="icon"
            className="h-12 w-12 rounded-xl flex-shrink-0"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}

// Helper function to summarize conditions for display
function summarizeConditions(conditions: ConditionGroup): string {
  if (!conditions.rules || conditions.rules.length === 0) return "";
  
  const ruleDescriptions = conditions.rules.map((r) => {
    const fieldName = r.field;
    const op = r.operator;
    const val = r.value !== undefined ? String(r.value) : "";
    
    // Make operator more readable
    const opLabel: Record<string, string> = {
      equals: "=",
      notEquals: "≠",
      contains: "contains",
      notContains: "doesn't contain",
      isEmpty: "is empty",
      isNotEmpty: "has value",
      greaterThan: ">",
      lessThan: "<",
      greaterThanOrEqual: "≥",
      lessThanOrEqual: "≤",
      in: "is one of",
      notIn: "is not",
      startsWith: "starts with",
      endsWith: "ends with",
    };
    
    const readableOp = opLabel[op] || op;
    
    if (op === "isEmpty" || op === "isNotEmpty") {
      return `${fieldName} ${readableOp}`;
    }
    return `${fieldName} ${readableOp} ${val}`;
  });
  
  const connector = conditions.operator === "and" ? " AND " : " OR ";
  return ruleDescriptions.join(connector);
}

// Action Card Component
interface ActionCardProps {
  action: AIAction;
  onApply: () => void;
  selectedScreen: ScreenWithFields | null;
}

function ActionCard({ action, onApply, selectedScreen }: ActionCardProps) {
  const [isApplying, setIsApplying] = useState(false);

  const handleApply = async () => {
    setIsApplying(true);
    try {
      await onApply();
    } finally {
      setIsApplying(false);
    }
  };

  if (action.type === "createScreen") {
    const screenData = action.data as ScreenData;
    const screenType = screenData.type || "standard";
    
    // Get icon and color based on screen type
    const getScreenIcon = () => {
      switch (screenType) {
        case "signatory":
          return <Users className="h-4 w-4 text-[hsl(var(--mauveine))] mt-0.5 shrink-0" />;
        case "dynamic":
          return <Zap className="h-4 w-4 text-[hsl(var(--lime-green))] mt-0.5 shrink-0" />;
        default:
          return <FileText className="h-4 w-4 text-[hsl(var(--selise-blue))] mt-0.5 shrink-0" />;
      }
    };
    
    const getScreenTypeLabel = () => {
      switch (screenType) {
        case "signatory":
          return "Signatory Screen";
        case "dynamic":
          return "Dynamic Screen";
        default:
          return "Standard Screen";
      }
    };

    return (
      <div className="bg-white/80 rounded-xl p-3 border border-[hsl(var(--border))]">
        <div className="flex items-start gap-2 mb-2">
          {getScreenIcon()}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-xs font-semibold text-[hsl(var(--fg))]">
                {screenData.title}
              </p>
              <Badge variant="outline" className="text-[9px] py-0 px-1.5">
                {getScreenTypeLabel()}
              </Badge>
            </div>
            {screenData.description && (
              <p className="text-xs text-[hsl(var(--globe-grey))] truncate">
                {screenData.description}
              </p>
            )}
          </div>
        </div>
        
        {/* Standard screen fields */}
        {screenType === "standard" && screenData.fields && screenData.fields.length > 0 && (
          <div className="mb-3">
            <p className="text-[10px] text-[hsl(var(--globe-grey))] uppercase tracking-wider mb-1">
              Fields ({screenData.fields.length})
              {screenData.fields.some(f => f.aiSuggestionEnabled) && (
                <span className="ml-1 text-[hsl(var(--selise-blue))]">
                  • {screenData.fields.filter(f => f.aiSuggestionEnabled).length} with AI
                </span>
              )}
            </p>
            <div className="flex flex-wrap gap-1">
              {screenData.fields.map((field, idx) => (
                <Badge 
                  key={idx} 
                  variant="secondary" 
                  className={`text-[10px] py-0 ${field.aiSuggestionEnabled ? "bg-[hsl(var(--selise-blue))]/10 text-[hsl(var(--selise-blue))]" : ""}`}
                >
                  {field.aiSuggestionEnabled && <Sparkles className="h-2.5 w-2.5 mr-0.5" />}
                  {field.label}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        {/* Signatory screen config */}
        {screenType === "signatory" && screenData.signatoryConfig && (
          <div className="mb-3 p-2 rounded-lg bg-[hsl(var(--mauveine))]/10 border border-[hsl(var(--mauveine))]/20">
            <div className="flex items-center gap-1.5 mb-1">
              <Users className="h-3 w-3 text-[hsl(var(--mauveine))]" />
              <span className="text-[10px] font-semibold text-[hsl(var(--mauveine))] uppercase tracking-wider">
                {screenData.signatoryConfig.mode === "deterministic" ? "Fixed Signatories" : "Dynamic Collection"}
              </span>
            </div>
            <p className="text-[10px] text-[hsl(var(--fg))] mb-1">
              {screenData.signatoryConfig.minSignatories}-{screenData.signatoryConfig.maxSignatories} signatories
            </p>
            <div className="flex flex-wrap gap-1">
              {screenData.signatoryConfig.partyTypes.map((party) => (
                <Badge 
                  key={party.value} 
                  variant="outline" 
                  className="text-[9px] py-0 px-1.5 bg-white/50 text-[hsl(var(--mauveine))] border-[hsl(var(--mauveine))]/30"
                >
                  {party.label}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        {/* Dynamic screen config */}
        {screenType === "dynamic" && screenData.dynamicPrompt && (
          <div className="mb-3 p-2 rounded-lg bg-[hsl(var(--lime-green))]/10 border border-[hsl(var(--lime-green))]/20">
            <div className="flex items-center gap-1.5 mb-1">
              <Zap className="h-3 w-3 text-[hsl(var(--poly-green))]" />
              <span className="text-[10px] font-semibold text-[hsl(var(--poly-green))] uppercase tracking-wider">
                AI-Generated Fields
              </span>
            </div>
            <p className="text-[10px] text-[hsl(var(--fg))] line-clamp-2">
              {screenData.dynamicPrompt.substring(0, 80)}...
            </p>
            {screenData.dynamicMaxFields && (
              <p className="text-[9px] text-[hsl(var(--globe-grey))] mt-1">
                Max {screenData.dynamicMaxFields} fields
              </p>
            )}
          </div>
        )}
        
        {/* AI Enrichment (works for all screen types) */}
        {screenData.aiEnrichment && (
          <div className="mb-3 p-2 rounded-lg bg-[hsl(var(--selise-blue))]/10 border border-[hsl(var(--selise-blue))]/20">
            <div className="flex items-center gap-1.5 mb-1">
              <Wand2 className="h-3 w-3 text-[hsl(var(--selise-blue))]" />
              <span className="text-[10px] font-semibold text-[hsl(var(--selise-blue))] uppercase tracking-wider">
                AI Enrichment
              </span>
            </div>
            <p className="text-[10px] text-[hsl(var(--fg))] line-clamp-2 mb-1">
              {screenData.aiEnrichment.prompt.substring(0, 80)}...
            </p>
            <div className="flex flex-wrap gap-1">
              {Object.keys(screenData.aiEnrichment.outputSchema.properties || {}).map((key) => (
                <Badge 
                  key={key} 
                  variant="outline" 
                  className="text-[9px] py-0 px-1.5 bg-white/50 text-[hsl(var(--selise-blue))] border-[hsl(var(--selise-blue))]/30"
                >
                  {key}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        {/* Apply Standards indicator */}
        {screenData.enableApplyStandards && (
          <div className="mb-3 flex items-center gap-2 p-2 rounded-lg bg-[hsl(var(--lime-green))]/10 border border-[hsl(var(--lime-green))]/20">
            <Zap className="h-3.5 w-3.5 text-[hsl(var(--poly-green))]" />
            <span className="text-[10px] font-medium text-[hsl(var(--poly-green))]">
              One-click &quot;Apply Standards&quot; enabled
            </span>
          </div>
        )}
        
        {/* Screen Conditions indicator */}
        {screenData.conditions && screenData.conditions.rules && screenData.conditions.rules.length > 0 && (
          <div className="mb-3 p-2 rounded-lg bg-[hsl(var(--globe-grey))]/10 border border-[hsl(var(--globe-grey))]/20">
            <div className="flex items-center gap-1.5 mb-1">
              <Eye className="h-3 w-3 text-[hsl(var(--globe-grey))]" />
              <span className="text-[10px] font-semibold text-[hsl(var(--globe-grey))] uppercase tracking-wider">
                Conditional Screen
              </span>
            </div>
            <p className="text-[10px] text-[hsl(var(--fg))]">
              Shows when: {summarizeConditions(screenData.conditions)}
            </p>
          </div>
        )}
        
        {/* Conditional Fields indicator */}
        {screenType === "standard" && screenData.fields && screenData.fields.some(f => f.conditions && f.conditions.rules?.length > 0) && (
          <div className="mb-3 p-2 rounded-lg bg-[hsl(var(--globe-grey))]/5 border border-[hsl(var(--globe-grey))]/15">
            <div className="flex items-center gap-1.5 mb-1">
              <Eye className="h-3 w-3 text-[hsl(var(--globe-grey))]" />
              <span className="text-[10px] font-semibold text-[hsl(var(--globe-grey))] uppercase tracking-wider">
                Conditional Fields ({screenData.fields.filter(f => f.conditions && f.conditions.rules?.length > 0).length})
              </span>
            </div>
            <div className="space-y-1">
              {screenData.fields.filter(f => f.conditions && f.conditions.rules?.length > 0).slice(0, 3).map((field, idx) => (
                <p key={idx} className="text-[9px] text-[hsl(var(--globe-grey))]">
                  <span className="font-medium">{field.label}</span>: {summarizeConditions(field.conditions!)}
                </p>
              ))}
              {screenData.fields.filter(f => f.conditions && f.conditions.rules?.length > 0).length > 3 && (
                <p className="text-[9px] text-[hsl(var(--globe-grey))] italic">
                  +{screenData.fields.filter(f => f.conditions && f.conditions.rules?.length > 0).length - 3} more...
                </p>
              )}
            </div>
          </div>
        )}
        <Button
          size="sm"
          className="w-full h-8 text-xs"
          onClick={handleApply}
          disabled={action.applied || isApplying}
        >
          {action.applied ? (
            <>
              <Check className="h-3 w-3 mr-1" />
              Applied
            </>
          ) : isApplying ? (
            <>
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Plus className="h-3 w-3 mr-1" />
              Create Screen
            </>
          )}
        </Button>
      </div>
    );
  }

  if (action.type === "addFields") {
    const fieldsData = action.data as FieldData[];
    const conditionalFields = fieldsData.filter(f => f.conditions && f.conditions.rules?.length > 0);
    
    return (
      <div className="bg-white/80 rounded-xl p-3 border border-[hsl(var(--border))]">
        <div className="flex items-start gap-2 mb-2">
          <Plus className="h-4 w-4 text-[hsl(var(--lime-green))] mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-[hsl(var(--fg))]">
              Add {fieldsData.length} Field{fieldsData.length !== 1 ? "s" : ""}
            </p>
            {selectedScreen ? (
              <p className="text-xs text-[hsl(var(--globe-grey))]">
                to &quot;{selectedScreen.title}&quot;
              </p>
            ) : (
              <p className="text-xs text-[hsl(var(--crimson))]">
                Select a screen first
              </p>
            )}
          </div>
        </div>
        <div className="mb-3">
          <div className="flex flex-wrap gap-1">
            {fieldsData.map((field, idx) => (
              <Badge 
                key={idx} 
                variant="secondary" 
                className={`text-[10px] py-0 ${field.aiSuggestionEnabled ? "bg-[hsl(var(--selise-blue))]/10 text-[hsl(var(--selise-blue))]" : ""} ${field.conditions && field.conditions.rules?.length > 0 ? "border-[hsl(var(--globe-grey))]/30" : ""}`}
              >
                {field.conditions && field.conditions.rules?.length > 0 && <Eye className="h-2.5 w-2.5 mr-0.5 text-[hsl(var(--globe-grey))]" />}
                {field.aiSuggestionEnabled && <Sparkles className="h-2.5 w-2.5 mr-0.5" />}
                {field.label}
              </Badge>
            ))}
          </div>
        </div>
        
        {/* Conditional Fields indicator */}
        {conditionalFields.length > 0 && (
          <div className="mb-3 p-2 rounded-lg bg-[hsl(var(--globe-grey))]/5 border border-[hsl(var(--globe-grey))]/15">
            <div className="flex items-center gap-1.5 mb-1">
              <Eye className="h-3 w-3 text-[hsl(var(--globe-grey))]" />
              <span className="text-[10px] font-semibold text-[hsl(var(--globe-grey))] uppercase tracking-wider">
                Conditional Fields ({conditionalFields.length})
              </span>
            </div>
            <div className="space-y-1">
              {conditionalFields.slice(0, 3).map((field, idx) => (
                <p key={idx} className="text-[9px] text-[hsl(var(--globe-grey))]">
                  <span className="font-medium">{field.label}</span>: {summarizeConditions(field.conditions!)}
                </p>
              ))}
              {conditionalFields.length > 3 && (
                <p className="text-[9px] text-[hsl(var(--globe-grey))] italic">
                  +{conditionalFields.length - 3} more...
                </p>
              )}
            </div>
          </div>
        )}
        <Button
          size="sm"
          className="w-full h-8 text-xs"
          onClick={handleApply}
          disabled={action.applied || isApplying || !selectedScreen}
        >
          {action.applied ? (
            <>
              <Check className="h-3 w-3 mr-1" />
              Applied
            </>
          ) : isApplying ? (
            <>
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              Adding...
            </>
          ) : (
            <>
              <Plus className="h-3 w-3 mr-1" />
              Add Fields
            </>
          )}
        </Button>
      </div>
    );
  }

  if (action.type === "updateScreen") {
    const updateData = action.data as UpdateScreenData;
    const improvements: string[] = [];
    
    if (updateData.enableApplyStandards) improvements.push("Apply Standards");
    if (updateData.aiEnrichment) improvements.push("AI Enrichment");
    if (updateData.fields?.some(f => f.aiSuggestionEnabled)) {
      const count = updateData.fields?.filter(f => f.aiSuggestionEnabled).length || 0;
      improvements.push(`${count} AI-assisted fields`);
    }
    if (updateData.conditions && updateData.conditions.rules?.length > 0) {
      improvements.push("Conditional visibility");
    }
    if (updateData.fields?.some(f => f.conditions && f.conditions.rules?.length > 0)) {
      const count = updateData.fields?.filter(f => f.conditions && f.conditions.rules?.length > 0).length || 0;
      improvements.push(`${count} conditional fields`);
    }
    
    return (
      <div className="bg-gradient-to-br from-[hsl(var(--selise-blue))]/5 to-[hsl(var(--selise-blue))]/10 rounded-xl p-3 border border-[hsl(var(--selise-blue))]/30">
        <div className="flex items-start gap-2 mb-2">
          <Wand2 className="h-4 w-4 text-[hsl(var(--selise-blue))] mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-xs font-semibold text-[hsl(var(--fg))]">
                Update: {updateData.title || "Screen"}
              </p>
              <Badge variant="outline" className="text-[9px] py-0 px-1.5 bg-[hsl(var(--selise-blue))]/10 text-[hsl(var(--selise-blue))] border-[hsl(var(--selise-blue))]/30">
                AI Improvements
              </Badge>
            </div>
            {improvements.length > 0 && (
              <p className="text-[10px] text-[hsl(var(--selise-blue))]">
                Adding: {improvements.join(", ")}
              </p>
            )}
          </div>
        </div>
        
        {/* Screen Conditions indicator */}
        {updateData.conditions && updateData.conditions.rules && updateData.conditions.rules.length > 0 && (
          <div className="mb-3 p-2 rounded-lg bg-[hsl(var(--globe-grey))]/10 border border-[hsl(var(--globe-grey))]/20">
            <div className="flex items-center gap-1.5 mb-1">
              <Eye className="h-3 w-3 text-[hsl(var(--globe-grey))]" />
              <span className="text-[10px] font-semibold text-[hsl(var(--globe-grey))] uppercase tracking-wider">
                Conditional Screen
              </span>
            </div>
            <p className="text-[10px] text-[hsl(var(--fg))]">
              Shows when: {summarizeConditions(updateData.conditions)}
            </p>
          </div>
        )}
        
        {updateData.fields && updateData.fields.length > 0 && (
          <div className="mb-3">
            <p className="text-[10px] text-[hsl(var(--globe-grey))] uppercase tracking-wider mb-1">
              Fields ({updateData.fields.length})
            </p>
            <div className="flex flex-wrap gap-1">
              {updateData.fields.slice(0, 8).map((field, idx) => (
                <Badge 
                  key={idx} 
                  variant="secondary" 
                  className={`text-[10px] py-0 ${field.aiSuggestionEnabled ? "bg-[hsl(var(--selise-blue))]/10 text-[hsl(var(--selise-blue))]" : ""}`}
                >
                  {field.aiSuggestionEnabled && <Sparkles className="h-2.5 w-2.5 mr-0.5" />}
                  {field.label}
                </Badge>
              ))}
              {updateData.fields.length > 8 && (
                <Badge variant="secondary" className="text-[10px] py-0">
                  +{updateData.fields.length - 8} more
                </Badge>
              )}
            </div>
          </div>
        )}
        
        <Button
          size="sm"
          className="w-full h-8 text-xs bg-[hsl(var(--selise-blue))] hover:bg-[hsl(var(--selise-blue))]/90"
          onClick={handleApply}
          disabled={action.applied || isApplying}
        >
          {action.applied ? (
            <>
              <Check className="h-3 w-3 mr-1" />
              Updated
            </>
          ) : isApplying ? (
            <>
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              Updating...
            </>
          ) : (
            <>
              <Wand2 className="h-3 w-3 mr-1" />
              Apply Improvements
            </>
          )}
        </Button>
      </div>
    );
  }

  if (action.type === "removeScreen") {
    const removeData = action.data as RemoveScreenData;
    return (
      <div className="bg-[hsl(var(--crimson))]/5 rounded-xl p-3 border border-[hsl(var(--crimson))]/30">
        <div className="flex items-start gap-2 mb-2">
          <X className="h-4 w-4 text-[hsl(var(--crimson))] mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-[hsl(var(--fg))]">
              Remove Screen
            </p>
            <p className="text-[10px] text-[hsl(var(--crimson))]">
              ID: {removeData.screenId.substring(0, 8)}...
            </p>
          </div>
        </div>
        <Button
          size="sm"
          variant="destructive"
          className="w-full h-8 text-xs"
          onClick={handleApply}
          disabled={action.applied || isApplying}
        >
          {action.applied ? (
            <>
              <Check className="h-3 w-3 mr-1" />
              Removed
            </>
          ) : isApplying ? (
            <>
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              Removing...
            </>
          ) : (
            <>
              <X className="h-3 w-3 mr-1" />
              Remove
            </>
          )}
        </Button>
      </div>
    );
  }

  if (action.type === "reorderScreens") {
    const reorderData = action.data as ReorderScreensData;
    return (
      <div className="bg-[hsl(var(--globe-grey))]/5 rounded-xl p-3 border border-[hsl(var(--globe-grey))]/30">
        <div className="flex items-start gap-2 mb-2">
          <FileText className="h-4 w-4 text-[hsl(var(--globe-grey))] mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-[hsl(var(--fg))]">
              Reorder Screens
            </p>
            <p className="text-[10px] text-[hsl(var(--globe-grey))]">
              {reorderData.screenOrder?.length || 0} screens will be reordered
            </p>
          </div>
        </div>
        <Button
          size="sm"
          className="w-full h-8 text-xs"
          onClick={handleApply}
          disabled={action.applied || isApplying}
        >
          {action.applied ? (
            <>
              <Check className="h-3 w-3 mr-1" />
              Reordered
            </>
          ) : isApplying ? (
            <>
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              Reordering...
            </>
          ) : (
            <>
              <FileText className="h-3 w-3 mr-1" />
              Apply Order
            </>
          )}
        </Button>
      </div>
    );
  }

  return null;
}
