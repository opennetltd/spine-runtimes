# Haxe Serializer Generator Rewrite TODO

## Phase 1: Build Mapping Infrastructure
- [ ] Create parser for java-haxe-diff.md
- [ ] Build structured mapping database
- [ ] Implement transformation rules engine
- [ ] Add context-aware lookup system

## Phase 2: Implement Core Transformations  
- [ ] Implement getter-to-field transformer
- [ ] Implement type transformer (Java → Haxe)
- [ ] Implement access pattern resolver
- [ ] Handle special cases and exceptions

## Phase 3: Code Generation
- [ ] Refactor property code generator
- [ ] Update method generator for Haxe idioms
- [ ] Implement special method handlers
- [ ] Add proper enum handling

## Phase 4: Validation and Testing
- [ ] Add compile-time validation
- [ ] Test generated serializer compilation
- [ ] Compare output with Java reference
- [ ] Fix any discrepancies

## Current Status
Starting Phase 1 - Building the mapping parser