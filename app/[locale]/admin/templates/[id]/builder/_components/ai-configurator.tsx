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

interface FieldData {
  name: string;
  label: string;
  type: "text" | "email" | "date" | "number" | "checkbox" | "select";
  required: boolean;
  placeholder?: string;
  helpText?: string;
  options?: string[];
  aiSuggestionEnabled?: boolean;
  aiSuggestionKey?: string;
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

interface AIAction {
  type: "createScreen" | "addFields" | "modifyField" | "deleteField";
  data: ScreenData | FieldData | FieldData[];
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
  const [contextExpanded, setContextExpanded] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: generateId(),
      role: "user",
      content: input.trim(),
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
              aiPrompt: s.aiPrompt,
              aiOutputSchema: s.aiOutputSchema,
              fields: s.fields.map((f) => ({
                name: f.name,
                label: f.label,
                type: f.type,
                required: f.required,
                placeholder: f.placeholder,
                helpText: f.helpText,
                options: f.options,
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
      };

      setMessages((prev) => [...prev, assistantMessage]);
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    // Auto-send after a brief delay to show the input
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
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
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-[hsl(var(--muted))] rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-[hsl(var(--selise-blue))]" />
                    <span className="text-sm text-[hsl(var(--globe-grey))]">
                      Thinking...
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
            onClick={sendMessage}
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
                className={`text-[10px] py-0 ${field.aiSuggestionEnabled ? "bg-[hsl(var(--selise-blue))]/10 text-[hsl(var(--selise-blue))]" : ""}`}
              >
                {field.aiSuggestionEnabled && <Sparkles className="h-2.5 w-2.5 mr-0.5" />}
                {field.label}
              </Badge>
            ))}
          </div>
        </div>
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

  return null;
}
