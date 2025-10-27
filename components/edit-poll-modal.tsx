'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { usePollsStore } from '@/lib/stores/polls-store';
import { toast } from 'sonner';
import { Loader2, Pencil, Trash2, Plus } from 'lucide-react';
import { UpdatePollRequest } from '@/application-shared/interfaces/polls-interface';
import { TOAST_MESSAGES } from '@/application-shared/constants/toaster-constants';
import {
  validatePollTitle,
  getValidOptions,
  validatePollOptions,
  canRemoveOption,
  splitOptionsByExistence,
} from './helper/edit-poll-modal-helpers';
import { EditPollModalProps } from './interfaces/edit-poll-modal-interface';

export function EditPollModal({ poll, open, onOpenChange }: Omit<EditPollModalProps, 'onPollUpdated'>) {
  const { updatePoll, deletePoll, addPollOptions, deletePollOptions, polls } = usePollsStore();
  const [currentPoll, setCurrentPoll] = useState(poll);
  const [title, setTitle] = useState(poll.title || '');
  const [options, setOptions] = useState(poll.options?.map(opt => ({
    uuid: opt.uuid,
    version_id: opt.version_id,
    text: opt.option_name,
  })));
  const [loading, setLoading] = useState(false);
  const ignorePollUpdateRef = useRef(false);

  // Update from store when poll changes (e.g., when options are added/deleted via API)
  useEffect(() => {
    const updatedPoll = polls.find(p => p.uuid === poll.uuid);
    if (updatedPoll && open) {
      // Only update if the modal is not currently being edited and we have more options
      // This prevents race conditions when adding/removing options
      if (updatedPoll.options.length !== options.length) {
        setCurrentPoll(updatedPoll);
        setTitle(updatedPoll.title);
        setOptions(updatedPoll.options.map(opt => ({
          uuid: opt.uuid,
          version_id: opt.version_id,
          text: opt.option_name,
        })));
      }
    }
  }, [polls, poll.uuid, open]);

  useEffect(() => {
    if (ignorePollUpdateRef.current) {
      ignorePollUpdateRef.current = false;
      return;
    }
    
    // Only update if we have complete poll data to avoid undefined errors
    if (open && poll.uuid !== currentPoll.uuid && poll.title && poll.options && poll.options.length > 0) {
      setCurrentPoll(poll);
      setTitle(poll.title);
      setOptions(poll.options.map(opt => ({
        uuid: opt.uuid,
        version_id: opt.version_id,
        text: opt.option_name,
      })));
    }
  }, [open, poll.uuid, currentPoll.uuid]);

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index].text = value;
    setOptions(newOptions);
  };

  const addOption = () => {
    setOptions([...options, { uuid: '', version_id: 0, text: '' }]);
  };

  const removeOption = async (index: number) => {
    if (!canRemoveOption(options.length)) {
      toast.error(TOAST_MESSAGES.POLL.MIN_OPTIONS_REQUIRED);
      return;
    }

    const optionToRemove = options[index];
    
    if (optionToRemove.uuid) {
      setLoading(true);
      ignorePollUpdateRef.current = true;
      try {
        await deletePollOptions(currentPoll.uuid, [optionToRemove.uuid]);
        toast.success(TOAST_MESSAGES.POLL.OPTION_DELETED_SUCCESS);
        // Update local options state
        setOptions(options.filter((_, i) => i !== index));
      } catch (error: any) {
        toast.error(error.message || TOAST_MESSAGES.POLL.OPTION_DELETED_FAILED);
      } finally {
        setLoading(false);
      }
    } else {
      const newOptions = options.filter((_, i) => i !== index);
      setOptions(newOptions);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this poll? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    try {
      await deletePoll(currentPoll.uuid);
      toast.success(TOAST_MESSAGES.POLL.DELETED_SUCCESS);
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || TOAST_MESSAGES.POLL.DELETED_FAILED);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const titleValidation = validatePollTitle(title);
    if (!titleValidation.valid) {
      toast.error(titleValidation.message);
      return;
    }

    const validOptions = getValidOptions(options) as typeof options;
    
    const optionsValidation = validatePollOptions(validOptions.length);
    if (!optionsValidation.valid) {
      toast.error(optionsValidation.message);
      return;
    }

    const { existingOptions, newOptions } = splitOptionsByExistence(validOptions);
    const originalOptions = currentPoll.options;
    const deletedOptions = originalOptions
      .filter(origOpt => !validOptions.some(vOpt => vOpt.uuid === origOpt.uuid))
      .map(opt => opt.uuid);

    if (!currentPoll.version_id) {
      toast.error(TOAST_MESSAGES.POLL.MISSING_VERSION_INFO);
      return;
    }

    setLoading(true);

    try {
      const latestPoll = polls.find(p => p.uuid === currentPoll.uuid) || currentPoll;

      // Delete options if needed
      if (deletedOptions.length > 0) {
        await deletePollOptions(latestPoll.uuid, deletedOptions);
      }

      // Update poll title/options if needed
      if (title.trim() !== latestPoll.title || existingOptions.some((opt, idx) =>
        opt.text.trim() !== latestPoll.options[idx]?.option_name
      )) {
        const updateData: UpdatePollRequest = {
          title: title.trim(),
          options: existingOptions.map(opt => ({
            uuid: opt.uuid,
            version_id: opt.version_id,
            option_name: opt.text.trim(),
          })),
          version_id: latestPoll.version_id,
        };

        await updatePoll(latestPoll.uuid, updateData);
      }

      // Add new options if needed
      if (newOptions.length > 0) {
        await addPollOptions(latestPoll.uuid, newOptions.map(opt => ({
          option_name: opt.text.trim()
        })));
      }

      toast.success(TOAST_MESSAGES.POLL.UPDATED_SUCCESS);
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error updating poll:', error);
      if (error.message?.includes('version')) {
        toast.error(TOAST_MESSAGES.POLL.UPDATED_VERSION_CONFLICT);
      } else {
        toast.error(error.message || TOAST_MESSAGES.POLL.UPDATED_FAILED);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Pencil className="w-5 h-5" />
            Edit Poll
          </DialogTitle>
          <DialogDescription>
            Update your poll title and options
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="edit-title" className="text-base font-semibold text-slate-700">
              Poll Question
            </Label>
            <Input
              id="edit-title"
              type="text"
              placeholder="What's your question?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-base py-6 border-slate-300"
              maxLength={300}
              required
              disabled={loading}
            />
            <p className="text-sm text-slate-500">{(title || '').length}/300 characters</p>
          </div>

          <div className="space-y-3">
            <Label className="text-base font-semibold text-slate-700">
              Options
            </Label>
            {options.map((option, index) => (
              <div key={option.uuid || index} className="flex gap-2">
                <Input
                  type="text"
                  placeholder={`Option ${index + 1}`}
                  value={option.text}
                  onChange={(e) => updateOption(index, e.target.value)}
                  className="border-slate-300"
                  maxLength={200}
                  required
                  disabled={loading}
                />
                {canRemoveOption(options.length) && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeOption(index)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    disabled={loading}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={addOption}
              className="w-full border-dashed border-2 border-slate-300 hover:border-blue-400 hover:bg-blue-50"
              disabled={loading}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Option
            </Button>
          </div>

          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-6 text-base font-semibold"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Pencil className="w-4 h-4 mr-2" />
                  Update Poll
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="px-6"
            >
              Cancel
            </Button>
          </div>

          <div className="border-t pt-4 mt-4">
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
              className="w-full"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Poll
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

