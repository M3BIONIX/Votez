'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePollsStore } from '@/lib/stores/polls-store';
import { PlusCircle, X, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { TOAST_MESSAGES } from '@/application-shared/constants/toaster-constants';
import {
  validatePollTitle,
  getValidOptions,
  validatePollOptions,
  canAddOption,
  canRemoveOption,
} from './helper/create-poll-form-helpers';
import { CreatePollFormProps } from './interfaces/create-poll-form-interface';

export function CreatePollForm({ onPollCreated }: CreatePollFormProps) {
  const { createPoll } = usePollsStore();
  const [title, setTitle] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [loading, setLoading] = useState(false);

  const addOption = () => {
    if (canAddOption(options.length)) {
      setOptions([...options, '']);
    }
  };

  const removeOption = (index: number) => {
    if (canRemoveOption(options.length)) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate title
    const titleValidation = validatePollTitle(title);
    if (!titleValidation.valid) {
      toast.error(titleValidation.message);
      return;
    }

    const validOptions = getValidOptions(options);

    // Validate options
    const optionsValidation = validatePollOptions(validOptions);
    if (!optionsValidation.valid) {
      toast.error(optionsValidation.message);
      return;
    }

    setLoading(true);

    try {
      await createPoll({
        title: title.trim(),
        options: validOptions.map(opt => ({ option_name: opt.trim() }))
      });

      toast.success(TOAST_MESSAGES.POLL.CREATED_SUCCESS);
      onPollCreated(null as any); // WebSocket will handle the poll creation
      setTitle('');
      setOptions(['', '']);
    } catch (error) {
      toast.error(TOAST_MESSAGES.POLL.CREATED_FAILED);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title" className="text-base font-semibold text-slate-700">
          Poll Question
        </Label>
        <Input
          id="title"
          type="text"
          placeholder="What's your question?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="text-base py-6 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
          maxLength={300}
          required
        />
        <p className="text-sm text-slate-500">{title.length}/300 characters</p>
      </div>

      <div className="space-y-3">
        <Label className="text-base font-semibold text-slate-700">
          Options (2-10)
        </Label>
        {options.map((option, index) => (
          <div key={index} className="flex gap-2">
            <Input
              type="text"
              placeholder={`Option ${index + 1}`}
              value={option}
              onChange={(e) => updateOption(index, e.target.value)}
              className="flex-1 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
              maxLength={200}
              required
            />
            {canRemoveOption(options.length) && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeOption(index)}
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        ))}

        {canAddOption(options.length) && (
          <Button
            type="button"
            variant="outline"
            onClick={addOption}
            className="w-full border-dashed border-2 border-slate-300 hover:border-blue-400 hover:bg-blue-50"
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            Add Option
          </Button>
        )}
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-base font-semibold rounded-lg shadow-md hover:shadow-lg transition-all"
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Creating...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 mr-2" />
            Create Poll
          </>
        )}
      </Button>
    </form>
  );
}
