'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Upload, Image as ImageIcon, Video, FileText, ChevronRight, ChevronLeft, Check, Loader2 } from "lucide-react";
import Link from "next/link";
import NextImage from "next/image";
import { MediaGallery } from "@/components/ui/media-gallery";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { generateSlugFromTitle, validateSlug, isSlugAvailable } from "@/lib/slug-utils";

interface MediaItem {
    id: string;
    url: string;
    type: 'image' | 'video';
    caption?: string;
}

export default function NewWorkflowPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [jsonInput, setJsonInput] = useState('');
    const [jsonUrl, setJsonUrl] = useState('');
    const [inputMethod, setInputMethod] = useState<'paste' | 'url'>('paste');
    const [jsonError, setJsonError] = useState('');
    const [jsonPreview, setJsonPreview] = useState<Record<string, unknown> | null>(null);
    const [tags, setTags] = useState<string[]>([]);
    const [newTag, setNewTag] = useState('');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [slug, setSlug] = useState('');
    const [slugError, setSlugError] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [isPaid, setIsPaid] = useState(false);
    const [isPrivate, setIsPrivate] = useState(false);
    const [howItWorks, setHowItWorks] = useState('');
    const [stepByStep, setStepByStep] = useState('');

    // New media states
    const [youtubeUrl, setYoutubeUrl] = useState('');
    const [posterImage, setPosterImage] = useState('');
    const [screenshots, setScreenshots] = useState<MediaItem[]>([]);
    const [demoImages, setDemoImages] = useState<MediaItem[]>([]);

    const steps = [
        { id: 1, title: "Basic Info", description: "Title, description, and category", icon: FileText },
        { id: 2, title: "Media & Demo", description: "Images, videos, and screenshots", icon: ImageIcon },
        { id: 3, title: "Workflow Data", description: "JSON content and configuration", icon: Upload },
        { id: 4, title: "Documentation", description: "How it works and instructions", icon: Video }
    ];

    const validateJson = (jsonString: string) => {
        try {
            const parsed = JSON.parse(jsonString);
            setJsonError('');
            setJsonPreview(parsed);
            return true;
        } catch (error) {
            console.error('Error parsing JSON:', error);
            setJsonError('Invalid JSON format');
            setJsonPreview(null);
            return false;
        }
    };

    const handleJsonInputChange = (value: string) => {
        setJsonInput(value);
        if (value.trim()) {
            validateJson(value);
        } else {
            setJsonError('');
            setJsonPreview(null);
        }
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

    const handleScreenshotsChange = (items: MediaItem[]) => {
        setScreenshots(items);
    };

    const handleDemoImagesChange = (items: MediaItem[]) => {
        setDemoImages(items);
    };

    const nextStep = () => {
        if (currentStep < steps.length) {
            setCurrentStep(currentStep + 1);
        }
    };

    const prevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!user) {
            toast.error("Please sign in to create a workflow");
            return;
        }

        // Validate required fields
        if (!title.trim()) {
            toast.error("Please enter a workflow title");
            return;
        }

        if (!description.trim()) {
            toast.error("Please enter a workflow description");
            return;
        }

        if (!slug.trim()) {
            toast.error("Please enter a URL slug");
            return;
        }

        if (slugError) {
            toast.error("Please fix the slug error before submitting");
            return;
        }

        setIsSubmitting(true);
        try {
            const formData = new FormData(event.currentTarget);

            // Add additional data to form
            formData.append('slug', slug);
            formData.append('youtubeUrl', youtubeUrl);
            formData.append('posterImage', posterImage);
            formData.append('screenshots', JSON.stringify(screenshots));
            formData.append('demoImages', JSON.stringify(demoImages));
            formData.append('tags', JSON.stringify(tags));
            formData.append('userId', user.id);

            // Debug: Log form data
            console.log('Form data being sent:');
            for (const [key, value] of formData.entries()) {

            }

            const response = await fetch('/api/workflows', {
                method: 'POST',
                body: formData,
            });

            const result = await response.json() as {
                success: boolean;
                workflow?: { id: string };
                error?: string;
            };

            if (result.success) {
                toast.success("Workflow created successfully!");
                router.push(`/workflows/w/${(result.workflow as any)?.slug || (result.workflow as any)?.id}`);
            } else {
                toast.error(result.error || "Failed to create workflow");
            }
        } catch (error) {
            console.error('Error creating workflow:', error);
            toast.error("An unexpected error occurred");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <MainLayout>
            <div className="container mx-auto px-4 py-8 max-w-6xl">
                <div className="mb-8">
                    <Link href="/workflows" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Workflows
                    </Link>
                    <h1 className="text-3xl font-bold">Create New Workflow</h1>
                    <p className="text-muted-foreground mt-2">
                        Share your N8N workflow with the community
                    </p>
                </div>

                {/* Progress Steps */}
                <div className="mb-8">
                    <div className="flex items-center justify-between max-w-4xl mx-auto">
                        {steps.map((step, index) => {
                            const Icon = step.icon;
                            const isActive = currentStep === step.id;
                            const isCompleted = currentStep > step.id;

                            return (
                                <div key={step.id} className="flex items-center">
                                    <div className={`flex flex-col items-center ${isActive ? 'text-primary' : isCompleted ? 'text-green-600' : 'text-muted-foreground'}`}>
                                        <div className={`flex items-center justify-center w-12 h-12 rounded-full border-2 mb-2 ${isActive
                                            ? 'bg-primary border-primary text-primary-foreground'
                                            : isCompleted
                                                ? 'bg-green-600 border-green-600 text-white'
                                                : 'border-muted-foreground'
                                            }`}>
                                            {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                                        </div>
                                        <div className="text-center">
                                            <p className="text-sm font-medium">{step.title}</p>
                                            <p className="text-xs text-muted-foreground hidden sm:block">{step.description}</p>
                                        </div>
                                    </div>
                                    {index < steps.length - 1 && (
                                        <div className={`hidden sm:block w-16 h-0.5 mx-4 ${currentStep > step.id ? 'bg-green-600' : 'bg-muted'
                                            }`} />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Hidden inputs to ensure all data is always in the form */}
                    <input type="hidden" name="title" value={title} />
                    <input type="hidden" name="description" value={description} />
                    <input type="hidden" name="slug" value={slug} />
                    <input type="hidden" name="categoryId" value={categoryId} />
                    <input type="hidden" name="isPaid" value={isPaid.toString()} />
                    <input type="hidden" name="isPrivate" value={isPrivate.toString()} />
                    <input type="hidden" name="posterImage" value={posterImage} />
                    <input type="hidden" name="jsonContent" value={jsonInput} />
                    <input type="hidden" name="jsonUrl" value={jsonUrl} />
                    <input type="hidden" name="howItWorks" value={howItWorks} />
                    <input type="hidden" name="stepByStep" value={stepByStep} />

                    {/* Step 1: Basic Information */}
                    {currentStep === 1 && (
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <FileText className="w-5 h-5" />
                                        Basic Information
                                    </CardTitle>
                                    <CardDescription>
                                        Provide essential details about your workflow
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="title">Workflow Title *</Label>
                                        <Input
                                            id="title"
                                            value={title}
                                            placeholder="e.g., Automated Email Marketing Campaign"
                                            required
                                            className="text-lg"
                                            onChange={(e) => {
                                                setTitle(e.target.value);
                                                // Auto-generate slug from title if slug is empty
                                                if (!slug) {
                                                    const generatedSlug = generateSlugFromTitle(e.target.value);
                                                    setSlug(generatedSlug);
                                                }
                                            }}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="slug">URL Slug *</Label>
                                        <div className="flex items-center space-x-2">
                                            <span className="text-sm text-muted-foreground">wrkflow.com/workflows/</span>
                                            <Input
                                                id="slug"
                                                value={slug}
                                                onChange={(e) => {
                                                    const newSlug = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                                                    setSlug(newSlug);

                                                    // Validate slug
                                                    const validation = validateSlug(newSlug);
                                                    setSlugError(validation.isValid ? '' : validation.error || '');
                                                }}
                                                placeholder="my-awesome-workflow"
                                                required
                                                className={slugError ? 'border-red-500' : ''}
                                            />
                                        </div>
                                        {slugError && (
                                            <p className="text-sm text-red-500">{slugError}</p>
                                        )}
                                        <p className="text-xs text-muted-foreground">
                                            This will be your workflow's URL. Only lowercase letters, numbers, and hyphens allowed.
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="categoryId">Category</Label>
                                            <Select value={categoryId} onValueChange={setCategoryId}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a category" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="automation">Automation</SelectItem>
                                                    <SelectItem value="integration">Integration</SelectItem>
                                                    <SelectItem value="data-processing">Data Processing</SelectItem>
                                                    <SelectItem value="marketing">Marketing</SelectItem>
                                                    <SelectItem value="productivity">Productivity</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Pricing</Label>
                                            <div className="flex items-center space-x-2">
                                                <Switch id="isPaid" checked={isPaid} onCheckedChange={setIsPaid} />
                                                <Label htmlFor="isPaid">Paid Workflow</Label>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="description">Description *</Label>
                                        <Textarea
                                            id="description"
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            placeholder="Describe what your workflow does, its benefits, and use cases..."
                                            required
                                            rows={4}
                                            className="resize-none"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Supports Markdown formatting
                                        </p>
                                    </div>

                                    <div className="space-y-4">
                                        <Label>Tags</Label>
                                        <div className="flex flex-wrap gap-2 mb-2">
                                            {tags.map((tag) => (
                                                <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                                                    {tag} ×
                                                </Badge>
                                            ))}
                                        </div>
                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="Add a tag..."
                                                value={newTag}
                                                onChange={(e) => setNewTag(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        addTag();
                                                    }
                                                }}
                                            />
                                            <Button type="button" onClick={addTag} variant="outline">
                                                Add
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="flex items-center space-x-2">
                                            <Switch id="isPaid" checked={isPaid} onCheckedChange={setIsPaid} />
                                            <Label htmlFor="isPaid">Paid Workflow</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Switch id="isPrivate" checked={isPrivate} onCheckedChange={setIsPrivate} />
                                            <Label htmlFor="isPrivate">Private Workflow</Label>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Step 2: Media & Demo */}
                    {currentStep === 2 && (
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <ImageIcon className="w-5 h-5" />
                                        Media & Demo Content
                                    </CardTitle>
                                    <CardDescription>
                                        Add visual content to showcase your workflow
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-8">
                                    {/* Poster Image */}
                                    <div className="space-y-4">
                                        <div>
                                            <Label htmlFor="posterImage">Poster Image</Label>
                                            <p className="text-sm text-muted-foreground">Main image that represents your workflow</p>
                                        </div>
                                        <Input
                                            id="posterImage"
                                            placeholder="https://example.com/poster.jpg"
                                            value={posterImage}
                                            onChange={(e) => setPosterImage(e.target.value)}
                                        />
                                        {posterImage && (
                                            <div className="max-w-md">
                                                <NextImage
                                                    src={posterImage}
                                                    alt="Poster preview"
                                                    width={400}
                                                    height={225}
                                                    className="w-full rounded-lg border"
                                                    onError={(e) => {
                                                        const target = e.target as HTMLImageElement;
                                                        target.style.display = 'none';
                                                    }}
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {/* YouTube Demo Video */}
                                    <div className="space-y-4">
                                        <div>
                                            <Label>Demo Video</Label>
                                            <p className="text-sm text-muted-foreground">Add a YouTube video demonstrating your workflow</p>
                                        </div>
                                        <Input
                                            placeholder="https://youtube.com/watch?v=..."
                                            value={youtubeUrl}
                                            onChange={(e) => setYoutubeUrl(e.target.value)}
                                        />
                                        {youtubeUrl && (
                                            <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                                                <Video className="h-12 w-12 text-muted-foreground" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Screenshots */}
                                    <div className="space-y-4">
                                        <div>
                                            <Label>Screenshots</Label>
                                            <p className="text-sm text-muted-foreground">Add screenshots of your workflow in action</p>
                                        </div>
                                        <MediaGallery
                                            items={screenshots}
                                            onItemsChange={handleScreenshotsChange}
                                            maxItems={8}
                                            type="image"
                                        />
                                    </div>

                                    {/* Demo Images */}
                                    <div className="space-y-4">
                                        <div>
                                            <Label>Demo Images</Label>
                                            <p className="text-sm text-muted-foreground">Additional images showing workflow results or setup</p>
                                        </div>
                                        <MediaGallery
                                            items={demoImages}
                                            onItemsChange={handleDemoImagesChange}
                                            maxItems={6}
                                            type="image"
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Step 3: Workflow Data */}
                    {currentStep === 3 && (
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Upload className="w-5 h-5" />
                                        Workflow Data
                                    </CardTitle>
                                    <CardDescription>
                                        Upload your N8N workflow JSON file or paste the content
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="flex gap-4 mb-4">
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

                                    {inputMethod === 'paste' ? (
                                        <div className="space-y-4">
                                            <Textarea
                                                placeholder="Paste your N8N workflow JSON here..."
                                                value={jsonInput}
                                                onChange={(e) => handleJsonInputChange(e.target.value)}
                                                rows={12}
                                                className="font-mono text-sm"
                                            />
                                            {jsonError && (
                                                <p className="text-sm text-destructive">{jsonError}</p>
                                            )}
                                            {jsonPreview && (
                                                <div className="p-4 bg-muted rounded-lg">
                                                    <p className="text-sm text-green-600 font-medium">✓ Valid JSON format</p>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <Input
                                                placeholder="https://raw.githubusercontent.com/user/repo/workflow.json"
                                                value={jsonUrl}
                                                onChange={(e) => setJsonUrl(e.target.value)}
                                            />
                                            <p className="text-sm text-muted-foreground">
                                                Provide a direct link to your JSON file (GitHub, Gist, Google Drive, etc.)
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Step 4: Documentation */}
                    {currentStep === 4 && (
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Video className="w-5 h-5" />
                                        Documentation
                                    </CardTitle>
                                    <CardDescription>
                                        Help users understand and implement your workflow
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="howItWorks">How It Works</Label>
                                        <Textarea
                                            id="howItWorks"
                                            value={howItWorks}
                                            onChange={(e) => setHowItWorks(e.target.value)}
                                            placeholder="Explain the workflow logic, what it does, and how it processes data..."
                                            rows={6}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="stepByStep">Step-by-Step Instructions</Label>
                                        <Textarea
                                            id="stepByStep"
                                            value={stepByStep}
                                            onChange={(e) => setStepByStep(e.target.value)}
                                            placeholder="Provide detailed setup instructions, required credentials, configuration steps..."
                                            rows={8}
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Navigation */}
                    <div className="flex justify-between items-center pt-6 border-t">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={prevStep}
                            disabled={currentStep === 1}
                        >
                            <ChevronLeft className="w-4 h-4 mr-2" />
                            Previous
                        </Button>

                        <div className="text-sm text-muted-foreground">
                            Step {currentStep} of {steps.length}
                        </div>

                        {currentStep < steps.length ? (
                            <Button type="button" onClick={nextStep}>
                                Next
                                <ChevronRight className="w-4 h-4 ml-2" />
                            </Button>
                        ) : (
                            <Button
                                type="submit"
                                size="lg"
                                className="w-full sm:w-auto"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <Check className="mr-2 h-4 w-4" />
                                        Create Workflow
                                    </>
                                )}
                            </Button>
                        )}
                    </div>
                </form>
            </div>
        </MainLayout>
    );
}