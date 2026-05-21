'use client';

import { useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Upload, Copy, Eye, EyeOff, Image, Video, FileText } from "lucide-react";
import Link from "next/link";
import { createWorkflow } from "./actions";
import { FormSubmitButton } from "@/components/ui/form-submit-button";
import { FileUpload } from "@/components/ui/file-upload";
import { MediaGallery } from "@/components/ui/media-gallery";
import { YouTubeEmbed } from "@/components/ui/youtube-embed";

interface MediaItem {
    id: string;
    url: string;
    type: 'image' | 'video';
    caption?: string;
}

export default function NewWorkflowPageOld() {
    const [jsonInput, setJsonInput] = useState('');
    const [jsonUrl, setJsonUrl] = useState('');
    const [inputMethod, setInputMethod] = useState<'paste' | 'url'>('paste');
    const [jsonError, setJsonError] = useState('');
    const [jsonPreview, setJsonPreview] = useState<Record<string, unknown> | null>(null);
    const [tags, setTags] = useState<string[]>([]);
    const [newTag, setNewTag] = useState('');
    
    // New media states
    const [youtubeUrl, setYoutubeUrl] = useState('');
    const [posterImage, setPosterImage] = useState('');
    const [screenshots, setScreenshots] = useState<MediaItem[]>([]);
    const [demoImages, setDemoImages] = useState<MediaItem[]>([]);
    const [currentStep, setCurrentStep] = useState(1);

    const validateJson = (jsonString: string) => {
        try {
            const parsed = JSON.parse(jsonString);
            setJsonError('');
            setJsonPreview(parsed);
            return true;
        } catch {
            setJsonError('Invalid JSON format. Please check your workflow JSON.');
            setJsonPreview(null);
            return false;
        }
    };

    const handleJsonChange = (value: string) => {
        setJsonInput(value);
        if (value.trim()) {
            validateJson(value);
        } else {
            setJsonError('');
            setJsonPreview(null);
        }
    };

    const copyJsonToClipboard = () => {
        navigator.clipboard.writeText(jsonInput);
    };

    const addTag = () => {
        if (newTag.trim() && !tags.includes(newTag.trim())) {
            setTags([...tags, newTag.trim()]);
            setNewTag('');
        }
    };

    const removeTag = (tagToRemove: string) => {
        setTags(tags.filter(tag => tag !== tagToRemove));
    };

    return (
        <MainLayout>
            <div className="container mx-auto py-8 max-w-4xl">
                <div className="mb-8">
                    <Button variant="ghost" asChild className="mb-4">
                        <Link href="/dashboard" className="flex items-center gap-2">
                            <ArrowLeft className="h-4 w-4" />
                            Back to Dashboard
                        </Link>
                    </Button>
                    <h1 className="text-3xl font-bold mb-2">Create New Workflow</h1>
                    <p className="text-muted-foreground">
                        Share your N8N workflow with the community
                    </p>
                </div>

                <form action={createWorkflow} className="space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Basic Information</CardTitle>
                            <CardDescription>
                                Provide basic details about your workflow
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Title *</Label>
                                <Input
                                    id="title"
                                    name="title"
                                    placeholder="Enter workflow title"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Description *</Label>
                                <Textarea
                                    id="description"
                                    name="description"
                                    placeholder="Describe what your workflow does (supports Markdown)"
                                    rows={4}
                                    required
                                    className="resize-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="coverImage">Poster Image URL</Label>
                                <Input
                                    id="coverImage"
                                    name="coverImage"
                                    type="url"
                                    placeholder="https://example.com/image.jpg"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Optional: Add a poster/cover image URL for your workflow
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="category">Category</Label>
                                <Select name="categoryId">
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ai">AI & Machine Learning</SelectItem>
                                        <SelectItem value="marketing">Marketing</SelectItem>
                                        <SelectItem value="sales">Sales</SelectItem>
                                        <SelectItem value="productivity">Productivity</SelectItem>
                                        <SelectItem value="integration">Integration</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Tags</Label>
                                <div className="flex gap-2 mb-2">
                                    <Input
                                        value={newTag}
                                        onChange={(e) => setNewTag(e.target.value)}
                                        placeholder="Add a tag"
                                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                                    />
                                    <Button type="button" onClick={addTag} variant="outline">Add</Button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {tags.map((tag) => (
                                        <span key={tag} className="bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-sm flex items-center gap-1">
                                            {tag}
                                            <button type="button" onClick={() => removeTag(tag)} className="text-xs">×</button>
                                        </span>
                                    ))}
                                </div>
                                <input type="hidden" name="tags" value={JSON.stringify(tags)} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Workflow Data</CardTitle>
                            <CardDescription>
                                Upload your N8N workflow JSON file or paste the content
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Input Method</Label>
                                <div className="flex gap-2">
                                    <Button 
                                        type="button" 
                                        variant={inputMethod === 'paste' ? 'default' : 'outline'}
                                        onClick={() => setInputMethod('paste')}
                                    >
                                        Paste JSON
                                    </Button>
                                    <Button 
                                        type="button" 
                                        variant={inputMethod === 'url' ? 'default' : 'outline'}
                                        onClick={() => setInputMethod('url')}
                                    >
                                        JSON URL
                                    </Button>
                                </div>
                            </div>

                            {inputMethod === 'url' ? (
                                <div className="space-y-2">
                                    <Label htmlFor="jsonUrl">JSON URL</Label>
                                    <Input
                                        id="jsonUrl"
                                        name="jsonUrl"
                                        value={jsonUrl}
                                        onChange={(e) => setJsonUrl(e.target.value)}
                                        placeholder="https://github.com/user/repo/raw/main/workflow.json"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Provide a direct link to your JSON file (GitHub, Gist, Google Drive, etc.)
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="jsonContent">Paste JSON Content</Label>
                                        {jsonInput && (
                                            <Button type="button" variant="outline" size="sm" onClick={copyJsonToClipboard}>
                                                <Copy className="h-3 w-3 mr-1" />
                                                Copy
                                            </Button>
                                        )}
                                    </div>
                                    <Textarea
                                        id="jsonContent"
                                        name="jsonContent"
                                        value={jsonInput}
                                        onChange={(e) => handleJsonChange(e.target.value)}
                                        placeholder="Paste your N8N workflow JSON here..."
                                        rows={8}
                                        className={`font-mono text-sm resize-none ${jsonError ? 'border-red-500' : jsonPreview ? 'border-green-500' : ''}`}
                                    />
                                    {jsonError && (
                                        <p className="text-sm text-red-500">{jsonError}</p>
                                    )}
                                    {jsonPreview && (
                                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                            <p className="text-sm text-green-700 font-medium">✓ Valid JSON detected</p>
                                            <p className="text-xs text-green-600">
                                                Workflow: {jsonPreview.name || 'Unnamed'} | 
                                                Nodes: {(jsonPreview.nodes as any)?.length || 0} | 
                                                Connections: {Object.keys((jsonPreview.connections as any) || {}).length}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Settings</CardTitle>
                            <CardDescription>
                                Configure privacy and monetization options
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center space-x-2">
                                <Switch id="isPaid" name="isPaid" />
                                <Label htmlFor="isPaid">Make this a paid workflow</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Switch id="isPrivate" name="isPrivate" />
                                <Label htmlFor="isPrivate">Make this workflow private</Label>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="price">Price (USD)</Label>
                                <Input
                                    id="price"
                                    name="price"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="0.00"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Leave empty or 0 for free workflows
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Documentation</CardTitle>
                            <CardDescription>
                                Help users understand how to use your workflow
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="howItWorks">How It Works</Label>
                                <Textarea
                                    id="howItWorks"
                                    name="howItWorks"
                                    placeholder="Explain how your workflow works (supports Markdown)"
                                    rows={6}
                                    className="resize-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="stepByStep">Step-by-Step Guide</Label>
                                <Textarea
                                    id="stepByStep"
                                    name="stepByStep"
                                    placeholder="Provide a step-by-step setup guide (supports Markdown)"
                                    rows={6}
                                    className="resize-none"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex gap-4">
                        <FormSubmitButton className="flex-1">
                            Publish Workflow
                        </FormSubmitButton>
                        <Button type="button" variant="outline" asChild>
                            <Link href="/dashboard">Cancel</Link>
                        </Button>
                    </div>
                </form>
            </div>
        </MainLayout>
    );
}