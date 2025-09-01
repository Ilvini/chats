import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const insertChatRoomSchema = z.object({
  id: z.string().min(1, "Chat ID is required").regex(/^[a-z0-9-]+$/, "ID must contain only lowercase letters, numbers, and hyphens"),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  status: z.string().default("active"),
  settings: z.string().optional()
});

const createChatSchema = insertChatRoomSchema;

type CreateChatForm = z.infer<typeof createChatSchema>;

export default function CreateChatForm() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<CreateChatForm>({
    resolver: zodResolver(createChatSchema),
    defaultValues: {
      id: "",
      name: "",
      description: "",
      status: "active",
      settings: JSON.stringify({
        theme: "blue",
        welcomeMessage: "Welcome to our chat! How can we help you today?"
      })
    },
  });

  const createChatMutation = useMutation({
    mutationFn: async (data: CreateChatForm) => {
      return apiRequest('POST', '/api/chatrooms', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chatrooms'] });
      form.reset();
      toast({
        title: "Success",
        description: "Chat room created successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create chat room",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateChatForm) => {
    createChatMutation.mutate(data);
  };

  const generateId = () => {
    const name = form.getValues('name');
    if (name) {
      const id = name.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      
      form.setValue('id', id + '-' + Math.random().toString(36).substr(2, 3));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Create New Chat</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Chat Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., Customer Support"
                      data-testid="input-chat-name"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        if (!form.getValues('id')) {
                          generateId();
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Brief description of the chat purpose"
                      rows={3}
                      data-testid="textarea-chat-description"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Custom ID</FormLabel>
                  <FormControl>
                    <div className="flex space-x-2">
                      <Input 
                        placeholder="auto-generated if empty"
                        data-testid="input-chat-id"
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={generateId}
                        data-testid="button-generate-id"
                      >
                        Generate
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              className="w-full"
              disabled={createChatMutation.isPending}
              data-testid="button-create-chat"
            >
              {createChatMutation.isPending ? "Creating..." : "Create Chat Room"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
