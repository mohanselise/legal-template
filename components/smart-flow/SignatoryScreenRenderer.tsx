"use client";

import React, { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import {
  Plus,
  Trash2,
  User,
  Mail,
  Phone,
  Building2,
  MapPin,
  Briefcase,
  GripVertical,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  SignatoryScreenConfig,
  SignatoryEntry,
  createBlankSignatory,
  validateAllSignatories,
  parseSignatoryConfig,
  initializeFromPredefined,
  getPredefinedConfig,
  canRemoveSignatory,
  DEFAULT_PARTY_TYPES,
} from "@/lib/templates/signatory-config";
import { interpolateVariables } from "@/lib/utils";

interface SignatoryScreenRendererProps {
  /** Screen configuration JSON from database */
  configJson: string | null | undefined;
  /** Current signatory data */
  value: SignatoryEntry[];
  /** Callback when signatories change */
  onChange: (signatories: SignatoryEntry[]) => void;
  /** Validation errors to display */
  errors?: Record<string, string>;
  /** Whether the form is in read-only mode */
  readOnly?: boolean;
  /** Form data from previous steps for pre-filling */
  formData?: Record<string, unknown>;
}

export function SignatoryScreenRenderer({
  configJson,
  value,
  onChange,
  errors,
  readOnly = false,
  formData = {},
}: SignatoryScreenRendererProps) {
  const config = useMemo(() => {
    const parsed = parseSignatoryConfig(configJson);
    console.log("[SignatoryScreenRenderer] Mode:", parsed.mode, "with", parsed.predefinedSignatories.length, "predefined signatories");
    return parsed;
  }, [configJson]);
  
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [initialized, setInitialized] = useState(false);
  
  // Initialize signatories based on mode
  const signatories = useMemo(() => {
    // If we already have signatories, return them
    if (value.length > 0) {
      return value;
    }
    
    // Deterministic mode: use predefined slots
    if (config.mode === "deterministic" && config.predefinedSignatories.length > 0) {
      return initializeFromPredefined(config, formData);
    }
    
    // Dynamic mode: start with minimum signatories
    if (config.mode === "dynamic" && config.minSignatories > 0) {
      const initial: SignatoryEntry[] = [];
      const defaultPartyType = config.partyTypes[0]?.value || DEFAULT_PARTY_TYPES[0].value;
      while (initial.length < config.minSignatories) {
        initial.push(createBlankSignatory(defaultPartyType));
      }
      return initial;
    }
    
    return [];
  }, [value, config, formData]);

  // Initialize value if empty (one-time effect)
  React.useEffect(() => {
    if (!initialized && value.length === 0 && signatories.length > 0) {
      onChange(signatories);
      setInitialized(true);
      // Auto-expand all cards initially
      setExpandedCards(new Set(signatories.map(s => s.id)));
    }
  }, [initialized, value.length, signatories, onChange]);

  // Validation
  const validation = useMemo(
    () => validateAllSignatories(signatories, config),
    [signatories, config]
  );

  const handleAddSignatory = useCallback(() => {
    if (signatories.length >= config.maxSignatories) return;
    const defaultPartyType = config.partyTypes[0]?.value || DEFAULT_PARTY_TYPES[0].value;
    const newSig = createBlankSignatory(defaultPartyType);
    onChange([...signatories, newSig]);
    setExpandedCards(prev => new Set([...prev, newSig.id]));
  }, [signatories, config, onChange]);

  const handleRemoveSignatory = useCallback((id: string) => {
    if (signatories.length <= config.minSignatories) return;
    onChange(signatories.filter(s => s.id !== id));
    setExpandedCards(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, [signatories, config, onChange]);

  const handleUpdateSignatory = useCallback((id: string, updates: Partial<SignatoryEntry>) => {
    onChange(signatories.map(s => s.id === id ? { ...s, ...updates } : s));
  }, [signatories, onChange]);

  const handleReorder = useCallback((newOrder: SignatoryEntry[]) => {
    onChange(newOrder);
  }, [onChange]);

  const toggleExpand = useCallback((id: string) => {
    setExpandedCards(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // In dynamic mode, users can add more signatories
  const canAddMore = config.mode === "dynamic" && signatories.length < config.maxSignatories;
  
  // Helper to check if a specific signatory can be removed
  const checkCanRemove = useCallback((signatory: SignatoryEntry) => {
    return canRemoveSignatory(signatory, config, signatories.length);
  }, [config, signatories.length]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-[hsl(var(--selise-blue))]/10 flex items-center justify-center">
            <Users className="h-5 w-5 text-[hsl(var(--selise-blue))]" />
          </div>
          <div>
            <h3 className="font-semibold text-[hsl(var(--fg))]">
              Signatories
            </h3>
            <p className="text-sm text-[hsl(var(--globe-grey))]">
              {config.mode === "deterministic" 
                ? `${signatories.length} signator${signatories.length !== 1 ? 'ies' : 'y'} required`
                : `${signatories.length} of ${config.maxSignatories} (minimum ${config.minSignatories})`
              }
            </p>
          </div>
        </div>
        {canAddMore && !readOnly && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddSignatory}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Signatory
          </Button>
        )}
      </div>

      {/* Global Validation Errors */}
      {validation.globalErrors.length > 0 && (
        <div className="rounded-lg border border-[hsl(var(--crimson))]/30 bg-[hsl(var(--crimson))]/5 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-[hsl(var(--crimson))] flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              {validation.globalErrors.map((error, index) => (
                <p key={index} className="text-sm text-[hsl(var(--crimson))]">
                  {error}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Signatory Cards */}
      <Reorder.Group
        axis="y"
        values={signatories}
        onReorder={handleReorder}
        className="space-y-3"
      >
        <AnimatePresence mode="popLayout">
          {signatories.map((signatory, index) => (
            <Reorder.Item
              key={signatory.id}
              value={signatory}
              dragListener={config.mode === "dynamic" && !readOnly}
            >
              <SignatoryCard
                signatory={signatory}
                index={index}
                config={config}
                isExpanded={expandedCards.has(signatory.id)}
                onToggleExpand={() => toggleExpand(signatory.id)}
                onUpdate={(updates) => handleUpdateSignatory(signatory.id, updates)}
                onRemove={() => handleRemoveSignatory(signatory.id)}
                canRemove={checkCanRemove(signatory)}
                readOnly={readOnly}
                validationResult={validation.entryErrors.get(signatory.id)}
                showDragHandle={config.mode === "dynamic"}
                formData={formData}
              />
            </Reorder.Item>
          ))}
        </AnimatePresence>
      </Reorder.Group>

      {/* Add More Button (bottom) - only in dynamic mode */}
      {canAddMore && !readOnly && signatories.length > 0 && (
        <motion.button
          type="button"
          onClick={handleAddSignatory}
          className="w-full py-4 border-2 border-dashed border-[hsl(var(--border))] rounded-xl text-[hsl(var(--globe-grey))] hover:border-[hsl(var(--selise-blue))] hover:text-[hsl(var(--selise-blue))] hover:bg-[hsl(var(--selise-blue))]/5 transition-colors flex items-center justify-center gap-2"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          <Plus className="h-5 w-5" />
          Add Another Signatory
        </motion.button>
      )}
    </div>
  );
}

// ============================================================================
// Signatory Card Component
// ============================================================================

interface SignatoryCardProps {
  signatory: SignatoryEntry;
  index: number;
  config: SignatoryScreenConfig;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onUpdate: (updates: Partial<SignatoryEntry>) => void;
  onRemove: () => void;
  canRemove: boolean;
  readOnly: boolean;
  validationResult?: { isValid: boolean; errors: { field: string; message: string }[] };
  showDragHandle?: boolean;
  formData?: Record<string, unknown>;
}

function SignatoryCard({
  signatory,
  index,
  config,
  isExpanded,
  onToggleExpand,
  onUpdate,
  onRemove,
  canRemove,
  readOnly,
  validationResult,
  showDragHandle = false,
  formData = {},
}: SignatoryCardProps) {
  const hasErrors = validationResult && !validationResult.isValid;
  const getFieldError = (field: string) => 
    validationResult?.errors.find(e => e.field === field)?.message;

  // Get pre-defined config for this signatory (if it came from a pre-defined slot)
  const predefinedConfig = getPredefinedConfig(signatory, config);
  
  // Get display label from predefined config and interpolate variables like {{companyName}}
  const displayLabel = predefinedConfig?.label 
    ? interpolateVariables(predefinedConfig.label, formData)
    : null;
  const displayDescription = predefinedConfig?.description 
    ? interpolateVariables(predefinedConfig.description, formData)
    : null;
  
  // Get party label
  const partyLabel = config.partyTypes.find(p => p.value === signatory.partyType)?.label 
    || DEFAULT_PARTY_TYPES.find(p => p.value === signatory.partyType)?.label
    || signatory.partyType;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`
        rounded-xl border transition-all
        ${hasErrors 
          ? "border-[hsl(var(--crimson))]/40 bg-[hsl(var(--crimson))]/5" 
          : "border-[hsl(var(--border))] bg-white hover:border-[hsl(var(--selise-blue))]/30"
        }
      `}
    >
      {/* Card Header */}
      <div
        className="flex items-center gap-3 p-4 cursor-pointer"
        onClick={onToggleExpand}
      >
        {showDragHandle && !readOnly && (
          <div className="cursor-grab active:cursor-grabbing text-[hsl(var(--globe-grey))] hover:text-[hsl(var(--fg))]">
            <GripVertical className="h-5 w-5" />
          </div>
        )}

        <div className="h-10 w-10 rounded-full bg-[hsl(var(--selise-blue))]/10 flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-semibold text-[hsl(var(--selise-blue))]">
            {index + 1}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {displayLabel && (
              <span className="font-semibold text-[hsl(var(--selise-blue))]">
                {displayLabel}
              </span>
            )}
            <span className="font-medium text-[hsl(var(--fg))] truncate">
              {signatory.name || (displayLabel ? "" : "New Signatory")}
            </span>
            <Badge variant="outline" className="text-xs flex-shrink-0">
              {partyLabel}
            </Badge>
            {signatory.isPrefilled && (
              <Badge variant="secondary" className="text-xs bg-[hsl(var(--lime-green))]/10 text-[hsl(var(--poly-green))]">
                Pre-filled
              </Badge>
            )}
            {hasErrors ? (
              <AlertCircle className="h-4 w-4 text-[hsl(var(--crimson))] flex-shrink-0" />
            ) : signatory.name && signatory.email ? (
              <CheckCircle2 className="h-4 w-4 text-[hsl(var(--lime-green))] flex-shrink-0" />
            ) : null}
          </div>
          {displayDescription && (
            <p className="text-xs text-[hsl(var(--globe-grey))] mt-0.5">
              {displayDescription}
            </p>
          )}
          {signatory.email && (
            <p className="text-sm text-[hsl(var(--globe-grey))] truncate">
              {signatory.email}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {canRemove && !readOnly && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-[hsl(var(--globe-grey))] hover:text-[hsl(var(--crimson))] hover:bg-[hsl(var(--crimson))]/10"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          <div className="text-[hsl(var(--globe-grey))]">
            {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </div>
        </div>
      </div>

      {/* Card Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-2 border-t border-[hsl(var(--border))] space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Party Type */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-[hsl(var(--globe-grey))]" />
                    Party Type *
                  </Label>
                  <Select
                    value={signatory.partyType}
                    onValueChange={(value) => onUpdate({ partyType: value })}
                    disabled={readOnly || config.mode === "deterministic"}
                  >
                    <SelectTrigger className={getFieldError("partyType") ? "border-[hsl(var(--crimson))]" : ""}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DEFAULT_PARTY_TYPES.map((party) => (
                        <SelectItem key={party.value} value={party.value}>
                          <div className="flex flex-col">
                            <span>{party.label}</span>
                            <span className="text-xs text-[hsl(var(--globe-grey))]">
                              {party.description}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {getFieldError("partyType") && (
                    <p className="text-xs text-[hsl(var(--crimson))]">{getFieldError("partyType")}</p>
                  )}
                </div>

                {/* Name */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <User className="h-4 w-4 text-[hsl(var(--globe-grey))]" />
                    Full Name *
                  </Label>
                  <Input
                    value={signatory.name}
                    onChange={(e) => onUpdate({ name: e.target.value })}
                    placeholder="John Doe"
                    disabled={readOnly}
                    className={getFieldError("name") ? "border-[hsl(var(--crimson))]" : ""}
                  />
                  {getFieldError("name") && (
                    <p className="text-xs text-[hsl(var(--crimson))]">{getFieldError("name")}</p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Mail className="h-4 w-4 text-[hsl(var(--globe-grey))]" />
                    Email Address *
                  </Label>
                  <Input
                    type="email"
                    value={signatory.email}
                    onChange={(e) => onUpdate({ email: e.target.value })}
                    placeholder="john@example.com"
                    disabled={readOnly}
                    className={getFieldError("email") ? "border-[hsl(var(--crimson))]" : ""}
                  />
                  {getFieldError("email") && (
                    <p className="text-xs text-[hsl(var(--crimson))]">{getFieldError("email")}</p>
                  )}
                </div>

                {/* Title */}
                {config.collectFields.title && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-[hsl(var(--globe-grey))]" />
                      Title / Role
                    </Label>
                    <Input
                      value={signatory.title || ""}
                      onChange={(e) => onUpdate({ title: e.target.value })}
                      placeholder="CEO, Manager, etc."
                      disabled={readOnly}
                    />
                  </div>
                )}

                {/* Phone */}
                {config.collectFields.phone && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Phone className="h-4 w-4 text-[hsl(var(--globe-grey))]" />
                      Phone Number
                    </Label>
                    <Input
                      type="tel"
                      value={signatory.phone || ""}
                      onChange={(e) => onUpdate({ phone: e.target.value })}
                      placeholder="+1 (555) 123-4567"
                      disabled={readOnly}
                      className={getFieldError("phone") ? "border-[hsl(var(--crimson))]" : ""}
                    />
                    {getFieldError("phone") && (
                      <p className="text-xs text-[hsl(var(--crimson))]">{getFieldError("phone")}</p>
                    )}
                  </div>
                )}

                {/* Company */}
                {config.collectFields.company && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-[hsl(var(--globe-grey))]" />
                      Company / Organization
                    </Label>
                    <Input
                      value={signatory.company || ""}
                      onChange={(e) => onUpdate({ company: e.target.value })}
                      placeholder="Company Name"
                      disabled={readOnly}
                    />
                  </div>
                )}

                {/* Address */}
                {config.collectFields.address && (
                  <div className="space-y-2 col-span-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-[hsl(var(--globe-grey))]" />
                      Address
                    </Label>
                    <Input
                      value={signatory.address || ""}
                      onChange={(e) => onUpdate({ address: e.target.value })}
                      placeholder="123 Main St, City, State, ZIP"
                      disabled={readOnly}
                    />
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default SignatoryScreenRenderer;
